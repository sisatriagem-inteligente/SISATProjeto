from typing import TypedDict # Define a estrutura e os tipos do estado do grafo.

from langchain_core.messages import BaseMessage # Representa as mensagens da conversa.

from app.cognitive_layer.schemas import ( #utilizando o schema, classes que já foram criadas
    DadosPaciente,
    DadosTriagem,
    ResumoTriagem,
    HipoteseClinica,
)
# Define as informações compartilhadas entre as etapas do grafo.
# Funciona como o estado atual da conversa durante o processamento.
class ConversationState(TypedDict):
    # Histórico de mensagens utilizado pelas etapas do fluxo
    messages: list[BaseMessage]
    dados_paciente: DadosPaciente
    dados_triagem: DadosTriagem
    resumo_triagem: ResumoTriagem
    hipoteses_clinicas: list[HipoteseClinica]
    # Campos que ainda precisam ser coletados durante a triagem.
    campos_pendentes: list[str]
    # Indica se o processamento da triagem já foi finalizado.
    finalizado: bool
