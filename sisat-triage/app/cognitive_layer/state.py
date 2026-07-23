from typing import TypedDict #TypeDict permite declarar exatamente quais campos existirão durante a execução do grafo

from langchain_core.messages import BaseMessage #BaseMessage, representa qualquer msg válida dentro da conversa

from app.cognitive_layer.schemas import ( #utilizando o schema, classes que já foram criadas
    DadosPaciente,
    DadosTriagem,
    ResumoTriagem,
    HipoteseClinica,
)
class ConversationState(TypedDict): #"ficha da conversa"
    messages: list[BaseMessage]
    dados_paciente: DadosPaciente
    dados_triagem: DadosTriagem
    resumo_triagem: ResumoTriagem
    hipoteses_clinicas: list[HipoteseClinica]
    campos_pendentes: list[str]
    finalizado: bool
