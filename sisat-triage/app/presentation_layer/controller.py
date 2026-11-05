from langchain_core.exceptions import OutputParserException
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.cognitive_layer.graph import app
from app.cognitive_layer.mar_ia_agent import (
    CHAT_SYSTEM_PROMPT,
    extrator_chat_llm,
    interpretar_historico,
    mensagem_chat_llm,
)
from app.cognitive_layer.schemas import RespostaChat
from app.presentation_layer.request_models import TriagemRequest
from app.observability import observar_etapa, observar_funcao
from app.langsmith_transport import registrar_configurado
from app.local_llm_debug import (
    depurar_etapa,
    registrar_chamada_llm,
    registrar_chat_debug,
    registrar_evento,
    registrar_saida,
)


# Converte o histórico recebido para os objetos de mensagem do LangChain
def _historico_langchain(request: TriagemRequest):
    historico = []
    for mensagem in request.messages:
        if mensagem.role == "user":
            historico.append(HumanMessage(content=mensagem.content))
        elif mensagem.role == "assistant":
            historico.append(AIMessage(content=mensagem.content))
    # Papéis diferentes de user e assistant não são incluídos no histórico
    return historico

# Instrumenta a extração usada pelo chat, sem registrar o conteúdo do histórico
@observar_funcao("extrair_dados", registrar_configurado)
def _extrair_dados(historico):
    return interpretar_historico(historico, extrator_chat_llm)

# Verifica se o texto não está vazio e termina com interrogação
def _mensagem_e_pergunta(resposta) -> bool:
    mensagem = resposta.mensagem.strip()
    return bool(mensagem) and mensagem.endswith("?")

# Desconsidera diferenças de caixa, espaços e pontuação final na comparação
def _normalizar_mensagem(mensagem: str) -> str:
    return " ".join(mensagem.casefold().strip().rstrip("?.!").split())

# Recupera a mensagem mais recente da MarIA no histórico
def _ultima_mensagem_maria(historico) -> str | None:
    for mensagem in reversed(historico):
        if isinstance(mensagem, AIMessage):
            return mensagem.content
    return None

# Confere o formato, o campo declarado e a repetição da última mensagem
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

# Agrupa os registros das etapas do chat sob uma execução principal
@observar_funcao("chat", registrar_configurado, agrupar=True)
@depurar_etapa("endpoint /chat")
def processar_chat(request: TriagemRequest):
    # O BFF continua sendo responsável por enviar todo o histórico.
    historico = _historico_langchain(request)
    registrar_evento("chat", f"Iniciado; mensagens no histórico: {len(historico)}.")

    try:
        dados = _extrair_dados(historico)
    except (OutputParserException, ValueError):
        registrar_evento("chat", "Extração inválida; mantendo a coleta aberta.")
        # Mantém a coleta aberta quando a extração não produz dados válidos
        mensagem_falha = (
            "Não consegui interpretar os dados agora. "
            "Por favor, envie novamente sua última mensagem."
        )
        registrar_chat_debug(None, "extração inválida", "nenhum", mensagem_falha)
        return RespostaChat(
            mensagem=mensagem_falha,
            finalizada=False,
        )

    # A conclusão depende das regras de pendência, não de uma decisão do modelo
    pendentes = dados.campos_pendentes()
    registrar_evento(
        "chat",
        f"Extração concluída; campos pendentes: {pendentes or 'nenhum'}.",
    )
    if not pendentes:
        registrar_evento("chat", "Coleta concluída; não será gerada outra pergunta.")
        mensagem_conclusao = "Obrigada pelas informações. A coleta foi concluída."
        registrar_chat_debug(dados, pendentes, "nenhum", mensagem_conclusao)
        return RespostaChat(
            mensagem=mensagem_conclusao,
            finalizada=True,
        )
    # Seleciona o primeiro campo pendente na ordem definida pela aplicação
    proximo_campo = pendentes[0]
    registrar_evento(
        "chat",
        f"Campo selecionado pela aplicação para a próxima pergunta: {proximo_campo}.",
    )
    # Informa ao modelo os dados disponíveis e o único campo a perguntar.
    contexto = SystemMessage(content=(
        f"Dados já coletados: {dados.model_dump(exclude_none=True)}. "
        f"O único campo que deve ser perguntado agora é: {proximo_campo}."
    ))
    # Combina as instruções gerais, o histórico e o contexto desta solicitação
    mensagens_chat = [
        SystemMessage(content=CHAT_SYSTEM_PROMPT),
        *historico,
        contexto,
    ]
    registrar_evento("chat", f"Preparada pergunta para o campo {proximo_campo!r}.")

    try:
        # Observa a chamada ao modelo sem incluir as mensagens no registro
        with observar_etapa("gerar_pergunta", registrar_configurado):
            with registrar_chamada_llm(
                "geracao da pergunta (tentativa 1)", mensagens_chat
            ):
                resposta = mensagem_chat_llm.invoke(mensagens_chat)
        registrar_saida("geracao da pergunta (tentativa 1)", resposta)
        precisa_tentar_novamente = not _pergunta_valida(
            resposta,
            _ultima_mensagem_maria(historico),
            proximo_campo,
        )
        if precisa_tentar_novamente:
            registrar_evento(
                "chat", "Pergunta rejeitada pela validação; será feita nova tentativa."
            )
    except (OutputParserException, ValueError):
        precisa_tentar_novamente = True

    # Realiza uma segunda tentativa quando a primeira resposta falha ou é rejeitada.
    if precisa_tentar_novamente:
        # Acrescenta uma orientação corretiva para a segunda tentativa
        mensagens_chat.append(SystemMessage(content=(
            "A resposta anterior foi inválida ou repetiu a última pergunta. "
            "Responda novamente com uma única pergunta objetiva somente sobre "
            f"o campo {proximo_campo} e termine com ponto de interrogação."
        )))
        try:
            with observar_etapa("gerar_pergunta", registrar_configurado):
                with registrar_chamada_llm(
                    "geracao da pergunta (tentativa 2)", mensagens_chat
                ):
                    resposta = mensagem_chat_llm.invoke(mensagens_chat)
            registrar_saida("geracao da pergunta (tentativa 2)", resposta)
        except (OutputParserException, ValueError):
            registrar_evento("chat", "Segunda tentativa inválida; usando fallback.")
            # Solicita nova mensagem quando a segunda geração também falha
            mensagem_falha = (
                "Não consegui formular a próxima pergunta agora. "
                "Por favor, envie novamente sua última mensagem."
            )
            registrar_chat_debug(
                dados, pendentes, proximo_campo, mensagem_falha,
            )
            return RespostaChat(
                mensagem=mensagem_falha,
                finalizada=False,
            )
        # Se a segunda resposta não passar nas verificações, usa uma pergunta fixa
        if not _pergunta_valida(
            resposta,
            _ultima_mensagem_maria(historico),
            proximo_campo,
        ):
            registrar_evento(
                "chat", "Pergunta da segunda tentativa rejeitada; usando fallback."
            )
            mensagem_fallback = (
                f"Ainda preciso saber sobre {proximo_campo}. "
                "Você pode informar?"
            )
            registrar_chat_debug(
                dados, pendentes, proximo_campo, mensagem_fallback,
            )
            return RespostaChat(
                mensagem=mensagem_fallback,
                finalizada=False,
            )
    # Devolve a pergunta aprovada, mantendo a coleta aberta
    registrar_evento("chat", "Pergunta aprovada; coleta continua aberta.")
    registrar_chat_debug(dados, pendentes, proximo_campo, resposta.mensagem)
    return RespostaChat(mensagem=resposta.mensagem, finalizada=False)


@depurar_etapa("endpoint /triagem")
def processar_triagem(request: TriagemRequest):
    # Agrupa os registros dos nós sob a operação principal de triagem
    with observar_etapa("triagem", registrar_configurado, agrupar=True):
        messages = _historico_langchain(request)
        registrar_evento(
            "grafo", f"Iniciando triagem com {len(messages)} mensagem(ns) no histórico."
        )

        # Inicia uma execução do grafo com o histórico recebido nesta requisição
        try:
            estado_final = app.invoke({"messages": messages})
        except Exception as erro:
            registrar_evento("grafo", f"Execução falhou com {type(erro).__name__}.")
            raise
        registrar_evento(
            "grafo",
            "Execução concluída; "
            f"finalizado={estado_final.get('finalizado', False)}, "
            f"campos_pendentes={estado_final.get('campos_pendentes', [])}.",
        )
        resposta_final = estado_final.get("resposta_final")

        # Exige a presença da ficha e a indicação de conclusão do processamento
        if resposta_final is None or not estado_final.get("finalizado", False):
            raise ValueError(
                "Não foi possível finalizar a triagem: "
                "verifique se todos os dados necessários foram coletados."
            )

        return resposta_final
