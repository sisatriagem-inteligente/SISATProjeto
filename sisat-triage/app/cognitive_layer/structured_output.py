# Configura a saída estruturada dos resultados clínicos da MarIA.
from app.cognitive_layer.schemas import ResultadoClinico
from app.cognitive_layer.mar_ia_agent import llm


# Configura a saída do modelo conforme o schema ResultadoClinico,
# que reúne o resumo e a lista de hipóteses
# Esta configuração não executa uma chamada ao Ollama
structured_clinical_llm = llm.with_structured_output(ResultadoClinico)


def gerar_resultado_clinico(messages) -> ResultadoClinico:
    # Executa a geração com as mensagens preparadas pelo nó gerar_resumo
    # A integração interpreta e valida a saída conforme o modelo Pydantic
    resposta: ResultadoClinico = structured_clinical_llm.invoke(messages)
    return resposta
