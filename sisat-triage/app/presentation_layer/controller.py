from langchain_core.exceptions import OutputParserException
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.cognitive_layer.graph import app
from app.cognitive_layer.mar_ia_agent import (
    CHAT_SYSTEM_PROMPT,
    EXTRACAO_SYSTEM_PROMPT,
    extrator_chat_llm,
    mensagem_chat_llm,
)
from app.cognitive_layer.schemas import RespostaChat
from app.cognitive_layer.structured_output import gerar_resposta_estruturada
from app.presentation_layer.request_models import TriagemRequest


def _historico_langchain(request: TriagemRequest):
    historico = []
    for mensagem in request.messages:
        if mensagem.role == "user":
            historico.append(HumanMessage(content=mensagem.content))
        elif mensagem.role == "assistant":
            historico.append(AIMessage(content=mensagem.content))
    return historico


def _extrair_dados(historico):
    mensagens = [SystemMessage(content=EXTRACAO_SYSTEM_PROMPT), *historico]
    # A primeira extração válida é a fonte de verdade. Uma nova chamada só é
    # feita quando o modelo não consegue produzir uma saída estruturada válida.
    try:
        return extrator_chat_llm.invoke(mensagens)
    except (OutputParserException, ValueError):
        pass

    revisao = [*mensagens, SystemMessage(content=(
        "Faça uma segunda leitura independente de todo o histórico. Considere "
        "o contexto das perguntas anteriores e preserve somente informações "
        "explicitamente fornecidas pelo paciente."
    ))]
    try:
        return extrator_chat_llm.invoke(revisao)
    except (OutputParserException, ValueError):
        raise OutputParserException("As duas extrações foram inválidas")


def _mensagem_e_pergunta(resposta) -> bool:
    mensagem = resposta.mensagem.strip()
    return bool(mensagem) and mensagem.endswith("?")


def _normalizar_mensagem(mensagem: str) -> str:
    return " ".join(mensagem.casefold().strip().rstrip("?.!").split())


def _ultima_mensagem_maria(historico) -> str | None:
    for mensagem in reversed(historico):
        if isinstance(mensagem, AIMessage):
            return mensagem.content
    return None


def _pergunta_valida(
    resposta,
    ultima_pergunta: str | None,
    campo_alvo: str,
) -> bool:
    if not _mensagem_e_pergunta(resposta):
        return False
    if resposta.campo_alvo != campo_alvo:
        return False
    if ultima_pergunta is None:
        return True
    return _normalizar_mensagem(resposta.mensagem) != _normalizar_mensagem(
        ultima_pergunta
    )


def processar_chat(request: TriagemRequest):
    # O BFF continua sendo responsável por enviar todo o histórico.
    historico = _historico_langchain(request)

    try:
        dados = _extrair_dados(historico)
    except (OutputParserException, ValueError):
        return RespostaChat(
            mensagem=(
                "Não consegui interpretar os dados agora. "
                "Por favor, envie novamente sua última mensagem."
            ),
            finalizada=False,
        )

    # O Python, e não o texto do modelo, decide quando a coleta terminou.
    pendentes = dados.campos_pendentes()
    print("=== CHAT DEBUG ===")
    print("DADOS EXTRAÍDOS:")
    print(dados.model_dump_json(indent=2))
    print("CAMPOS PENDENTES:")
    print(pendentes)
    if not pendentes:
        print("CAMPO ESCOLHIDO: nenhum")
        print("RESPOSTA GERADA:")
        print('"Obrigada pelas informações. A coleta foi concluída."')
        print("=== FIM CHAT DEBUG ===")
        return RespostaChat(
            mensagem="Obrigada pelas informações. A coleta foi concluída.",
            finalizada=True,
        )

    proximo_campo = pendentes[0]
    print(f"CAMPO ESCOLHIDO: {proximo_campo}")
    contexto = SystemMessage(content=(
        f"Dados já coletados: {dados.model_dump(exclude_none=True)}. "
        f"O único campo que deve ser perguntado agora é: {proximo_campo}."
    ))
    mensagens_chat = [
        SystemMessage(content=CHAT_SYSTEM_PROMPT),
        *historico,
        contexto,
    ]

    try:
        resposta = mensagem_chat_llm.invoke(mensagens_chat)
        precisa_tentar_novamente = not _pergunta_valida(
            resposta,
            _ultima_mensagem_maria(historico),
            proximo_campo,
        )
    except (OutputParserException, ValueError):
        precisa_tentar_novamente = True

    if precisa_tentar_novamente:
        mensagens_chat.append(SystemMessage(content=(
            "A resposta anterior foi inválida ou repetiu a última pergunta. "
            "Responda novamente com uma única pergunta objetiva somente sobre "
            f"o campo {proximo_campo} e termine com ponto de interrogação."
        )))
        try:
            resposta = mensagem_chat_llm.invoke(mensagens_chat)
        except (OutputParserException, ValueError):
            return RespostaChat(
                mensagem=(
                    "Não consegui formular a próxima pergunta agora. "
                    "Por favor, envie novamente sua última mensagem."
                ),
                finalizada=False,
            )

        if not _pergunta_valida(
            resposta,
            _ultima_mensagem_maria(historico),
            proximo_campo,
        ):
            mensagem_fallback = (
                f"Ainda preciso saber sobre {proximo_campo}. "
                "Você pode informar?"
            )
            print("RESPOSTA GERADA (fallback):")
            print(repr(mensagem_fallback))
            print("=== FIM CHAT DEBUG ===")
            return RespostaChat(
                mensagem=mensagem_fallback,
                finalizada=False,
            )

    print("RESPOSTA GERADA:")
    print(repr(resposta.mensagem))
    print("=== FIM CHAT DEBUG ===")
    return RespostaChat(mensagem=resposta.mensagem, finalizada=False)


def processar_triagem(request: TriagemRequest):
    # O fluxo final existente permanece inalterado.
    messages = _historico_langchain(request)
    estado_final = app.invoke({"messages": messages})
    return gerar_resposta_estruturada(estado_final["messages"])
