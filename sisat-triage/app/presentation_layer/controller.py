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
    resultados = []

    try:
        resultados.append(extrator_chat_llm.invoke(mensagens))
    except (OutputParserException, ValueError):
        pass

    revisao = [*mensagens, SystemMessage(content=(
        "Faça uma segunda leitura independente de todo o histórico. Considere "
        "o contexto das perguntas anteriores e preserve somente informações "
        "explicitamente fornecidas pelo paciente."
    ))]
    try:
        resultados.append(extrator_chat_llm.invoke(revisao))
    except (OutputParserException, ValueError):
        pass

    if not resultados:
        raise OutputParserException("As duas extrações foram inválidas")

    dados = resultados[0]
    for resultado in resultados[1:]:
        dados = dados.combinar(resultado)
    return dados


def _mensagem_e_pergunta(resposta) -> bool:
    mensagem = resposta.mensagem.strip()
    return bool(mensagem) and mensagem.endswith("?")


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
    if not pendentes:
        return RespostaChat(
            mensagem="Obrigada pelas informações. A coleta foi concluída.",
            finalizada=True,
        )

    contexto = SystemMessage(content=(
        f"Dados já coletados: {dados.model_dump(exclude_none=True)}. "
        f"Campos pendentes: {pendentes}."
    ))
    mensagens_chat = [
        SystemMessage(content=CHAT_SYSTEM_PROMPT),
        *historico,
        contexto,
    ]

    try:
        resposta = mensagem_chat_llm.invoke(mensagens_chat)
        precisa_tentar_novamente = not _mensagem_e_pergunta(resposta)
    except (OutputParserException, ValueError):
        precisa_tentar_novamente = True

    if precisa_tentar_novamente:
        mensagens_chat.append(SystemMessage(content=(
            "A resposta anterior não foi uma pergunta válida. Responda "
            "novamente com uma única pergunta objetiva sobre um dos campos "
            "pendentes e termine a mensagem com ponto de interrogação."
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

        if not _mensagem_e_pergunta(resposta):
            return RespostaChat(
                mensagem=(
                    "Não consegui formular a próxima pergunta agora. "
                    "Por favor, envie novamente sua última mensagem."
                ),
                finalizada=False,
            )

    return RespostaChat(mensagem=resposta.mensagem, finalizada=False)


def processar_triagem(request: TriagemRequest):
    # O fluxo final existente permanece inalterado.
    messages = _historico_langchain(request)
    estado_final = app.invoke({"messages": messages})
    return gerar_resposta_estruturada(estado_final["messages"])
