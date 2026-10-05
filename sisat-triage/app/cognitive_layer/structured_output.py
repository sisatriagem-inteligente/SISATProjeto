# Converte a resposta da MarIA para o formato final esperado pelo SISAT.
from app.cognitive_layer.schemas import RespostaFinal
from app.cognitive_layer.mar_ia_agent import llm

# Configura o modelo para gerar a resposta seguindo o schema oficial
# do resultado final da triagem.
structured_llm = llm.with_structured_output(RespostaFinal)

# Recebe o histórico da conversa e gera o resultado final estruturado.
def gerar_resposta_estruturada(messages) -> RespostaFinal:
    resposta_estruturada: RespostaFinal = structured_llm.invoke(messages)
    return resposta_estruturada