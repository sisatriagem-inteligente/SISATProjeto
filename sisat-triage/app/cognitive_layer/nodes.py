from app.cognitive_layer.state import ConversationState

# Representa a etapa de coleta dos dados básicos do paciente.
def coletar_paciente_node(state: ConversationState) -> ConversationState:
    return state

# Representa a etapa de coleta das informações da triagem.
def coletar_triagem_node(state: ConversationState) -> ConversationState:
    return state

# Representa a etapa de validação dos dados da conversa.
def validar_dados_node(state: ConversationState) -> ConversationState:
    return state

# Representa a etapa de geração do resumo da triagem.
def gerar_resumo_node(state: ConversationState) -> ConversationState:
    return state

# Representa a etapa de geração das hipóteses clínicas iniciais.
def gerar_hipoteses_node(state: ConversationState) -> ConversationState:
    return state

# Representa a etapa final do fluxo da triagem.
def finalizar_node(state: ConversationState) -> ConversationState:
    return state