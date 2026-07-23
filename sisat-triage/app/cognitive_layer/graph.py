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

workflow = StateGraph(ConversationState) # Cria o grafo da aplicação utilizando o ConversationState como estado compartilhado.

workflow.add_node("coletar_paciente", coletar_paciente_node) # Registra o nó responsável por coletar os dados básicos do paciente.
workflow.add_node("coletar_triagem", coletar_triagem_node)
workflow.add_node("validar_dados", validar_dados_node)
workflow.add_node("gerar_resumo", gerar_resumo_node)
workflow.add_node("gerar_hipoteses", gerar_hipoteses_node)
workflow.add_node("finalizar", finalizar_node)

workflow.add_edge(START,"coletar_paciente")

workflow.add_edge("coletar_paciente", "coletar_triagem") # Define as transições entre os nós, estabelecendo a ordem de execução da entrevista clínica.
workflow.add_edge("coletar_triagem","validar_dados")
workflow.add_edge("validar_dados", "gerar_resumo")
workflow.add_edge("gerar_resumo", "gerar_hipoteses")
workflow.add_edge( "gerar_hipoteses","finalizar")

workflow.add_edge( "finalizar",END)

# Compila o grafo e cria a aplicação executável do LangGraph.
app = workflow.compile()
