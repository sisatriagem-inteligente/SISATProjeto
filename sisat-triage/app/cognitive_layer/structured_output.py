# conversão da resposta da MarIA para o contrato de dados
from app.cognitive_layer.schemas import RespostaFinal
from app.cognitive_layer.mar_ia_agent import llm

# modelo configurado para retornar o Schema oficial do SISAT
structured_llm = llm.with_structured_output(RespostaFinal)

# Converte o histórico da conversa para o contrato de dados do SISAT
def gerar_resposta_estruturada(messages) -> RespostaFinal:
    resposta_estruturada: RespostaFinal = structured_llm.invoke(messages)
    return resposta_estruturada