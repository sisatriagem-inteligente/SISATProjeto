
from typing import TypedDict

from langchain_core.messages import BaseMessage  # Representa as mensagens do histórico da conversa.

from app.cognitive_layer.schemas import (  # Importa os modelos usados para estruturar os dados.
    DadosColetaChat,
    DadosPaciente,
    DadosTriagem,
    ResumoTriagem,
    HipoteseClinica,
    RespostaFinal,
)


# Descreve as chaves e os tipos esperados no estado compartilhado do grafo
# TypedDict fornece informações de tipagem; não executa validação como Pydantic
# Na execução atual, o estado começa com messages e recebe os demais campos
# conforme os nós retornam suas atualizações
class ConversationState(TypedDict):
    # Histórico de mensagens utilizado pelas etapas do fluxo.
    messages: list[BaseMessage]

    # Resultado da extração e conferência do histórico.
    # Pode estar ausente no início ou receber None quando não disponível.
    # Os nós seguintes reutilizam esse resultado, evitando nova extração dentro da mesma execução do grafo.
    dados_extraidos: DadosColetaChat | None

    # Dados básicos do paciente organizados para a ficha final.
    dados_paciente: DadosPaciente

    # Informações da triagem organizadas para a ficha final.
    dados_triagem: DadosTriagem

    # Resumo produzido a partir das informações da triagem.
    resumo_triagem: ResumoTriagem

    # Lista de hipóteses clínicas iniciais produzidas pela MarIA.
    hipoteses_clinicas: list[HipoteseClinica]

    # Lista dos campos que ainda precisam ser coletados ou preenchidos.
    campos_pendentes: list[str]

    # Indica se o processamento da triagem já foi finalizado.
    finalizado: bool

    # Resultado completo da triagem, pronto para ser devolvido pelo controlador.
    resposta_final: RespostaFinal | None

