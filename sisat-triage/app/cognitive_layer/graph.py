
from langgraph.graph import START, END, StateGraph

from app.cognitive_layer.state import ConversationState
from app.cognitive_layer.nodes import (
    extrair_dados_node,
    coletar_paciente_node,
    coletar_triagem_node,
    validar_dados_node,
    gerar_resumo_node,
    gerar_hipoteses_node,
    finalizar_node,
)


# Constrói o fluxo de triagem com os campos definidos em ConversationState.
workflow = StateGraph(ConversationState)

# Associa cada nome do grafo à função que executa a respectiva etapa
workflow.add_node("extrair_dados", extrair_dados_node)
workflow.add_node("coletar_paciente", coletar_paciente_node)
workflow.add_node("coletar_triagem", coletar_triagem_node)
workflow.add_node("validar_dados", validar_dados_node)
workflow.add_node("gerar_resumo", gerar_resumo_node)
workflow.add_node("gerar_hipoteses", gerar_hipoteses_node)
workflow.add_node("finalizar", finalizar_node)

# START e END são marcadores de entrada e saída, não funções de processamento
workflow.add_edge(START, "extrair_dados")

# Define a sequência de extração, organização e verificação dos dados
workflow.add_edge("extrair_dados", "coletar_paciente")
workflow.add_edge("coletar_paciente", "coletar_triagem")
workflow.add_edge("coletar_triagem", "validar_dados")


# Consulta as pendências produzidas pela validação para escolher o caminho
def decidir_proxima_etapa(state: ConversationState) -> str:
    if state.get("campos_pendentes"):
        return "aguardar_dados"

    return "gerar_resumo"

# Os valores retornados pela função são rótulos de roteamento
# "aguardar_dados" leva a END: encerra esta execução sem gerar a ficha
# Não cria uma pausa persistente nem aguarda outra mensagem dentro do grafo
workflow.add_conditional_edges(
    "validar_dados",
    decidir_proxima_etapa,
    {
        "aguardar_dados": END,
        "gerar_resumo": "gerar_resumo",
    },
)

# gerar_resumo produz resumo e hipóteses na mesma chamada ao modelo
# gerar_hipoteses permanece na sequência, sem processamento adicional
workflow.add_edge("gerar_resumo", "gerar_hipoteses")
workflow.add_edge("gerar_hipoteses", "finalizar")
workflow.add_edge("finalizar", END)

# Disponibiliza o grafo compilado para execução pelo controlador
# Compilar não executa os nós nem chama o modelo
app = workflow.compile()
