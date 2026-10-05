from langgraph.graph import START, END, StateGraph

from app.cognitive_layer.state import ConversationState # Importa o estado compartilhado utilizado durante toda a execução da conversa.

from app.cognitive_layer.nodes import ( # Importa todos os nós que compõem o fluxo conversacional da MarIA.
    coletar_paciente_node,
    coletar_triagem_node,
    validar_dados_node,
    gerar_resumo_node,
    gerar_hipoteses_node,
    finalizar_node,
)
# Cria o grafo utilizando o ConversationState como estado compartilhado
# entre as diferentes etapas do processamento.
workflow = StateGraph(ConversationState)

# Registra as etapas que fazem parte do fluxo da triagem.
workflow.add_node("coletar_paciente", coletar_paciente_node)
workflow.add_node("coletar_triagem", coletar_triagem_node)
workflow.add_node("validar_dados", validar_dados_node)
workflow.add_node("gerar_resumo", gerar_resumo_node)
workflow.add_node("gerar_hipoteses", gerar_hipoteses_node)
workflow.add_node("finalizar", finalizar_node)

# Define a ordem de execução das etapas do processamento.
workflow.add_edge(START,"coletar_paciente")

workflow.add_edge("coletar_paciente", "coletar_triagem")
workflow.add_edge("coletar_triagem","validar_dados")
workflow.add_edge("validar_dados", "gerar_resumo")
workflow.add_edge("gerar_resumo", "gerar_hipoteses")
workflow.add_edge( "gerar_hipoteses","finalizar")

workflow.add_edge( "finalizar",END)

# Compila o fluxo definido e cria a aplicação executável do LangGraph.
app = workflow.compile()
