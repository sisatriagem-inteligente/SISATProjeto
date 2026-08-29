# Tipos de mensagens utilizados pelo LangChain.
from langchain_core.messages import HumanMessage, AIMessage

# Grafo compilado da MarIA responsável por executar o fluxo da entrevista.
from app.cognitive_layer.graph import app

# Converte o histórico da conversa para o contrato estruturado do SISAT.
from app.cognitive_layer.structured_output import gerar_resposta_estruturada

# Modelo responsável por validar os dados recebidos pela API.
from app.presentation_layer.request_models import TriagemRequest


# Processa uma triagem recebida pelo sisat-bff,
# executa o fluxo da MarIA e retorna a resposta estruturada.
def processar_triagem(request: TriagemRequest):

    # Converte as mensagens recebidas pela API para os tipos
    # de mensagem utilizados internamente pelo LangChain.
    messages = []

    for mensagem in request.messages:

        if mensagem.role == "user":
            messages.append(
                HumanMessage(content=mensagem.content)
            )

        elif mensagem.role == "assistant":
            messages.append(
                AIMessage(content=mensagem.content)
            )

    # Executa o fluxo completo do LangGraph utilizando
    # o histórico convertido para o formato esperado pelo estado.
    estado_final = app.invoke({
        "messages": messages
    })

    # Converte as mensagens do estado final para o contrato
    # estruturado definido para a comunicação com o BFF.
    resposta_final = gerar_resposta_estruturada(
        estado_final["messages"]
    )

    # Retorna a resposta estruturada para a camada de apresentação.
    return resposta_final