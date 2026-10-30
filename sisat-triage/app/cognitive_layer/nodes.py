from langchain_core.messages import SystemMessage

from app.cognitive_layer.state import ConversationState
from app.cognitive_layer.schemas import (
    DadosPaciente,
    DadosTriagem,
    ResumoTriagem,
    RespostaFinal,
)
from app.cognitive_layer.mar_ia_agent import (
    extrator_chat_llm,
    interpretar_historico,
)
from app.cognitive_layer.structured_output import gerar_resultado_clinico
from app.observability import observar_funcao
from app.langsmith_transport import registrar_configurado


# Observa a etapa sem incluir o conteúdo do histórico no registro técnico
@observar_funcao("extrair_dados", registrar_configurado)
def extrair_dados_node(state: ConversationState) -> dict:
    # Recupera as mensagens recebidas nesta execução
    messages = state.get("messages", [])

    # Sem mensagens, não chama o extrator nem considera a coleta concluída
    if not messages:
        return {
            "dados_extraidos": None,
            "campos_pendentes": [
                "nome",
                "idade",
                "sexo",
                "queixa principal",
                "sintomas",
                "tempo dos sintomas",
                "intensidade",
                "informações complementares",
            ],
            "finalizado": False,
            "resposta_final": None,
        }

    # Utiliza a extração estruturada compartilhada com o endpoint de chat
    dados = interpretar_historico(messages, extrator_chat_llm)

    # Devolve atualizações parciais do estado
    # A conclusão e a ficha final serão determinadas pelos nós seguintes
    return {
        "dados_extraidos": dados,
        "campos_pendentes": dados.campos_pendentes(),
        "finalizado": False,
        "resposta_final": None,
    }

# Organiza os dados pessoais disponíveis no resultado da extração
@observar_funcao("coletar_paciente", registrar_configurado)
def coletar_paciente_node(state: ConversationState) -> dict:
    dados = state.get("dados_extraidos")

    # Sem resultado de extração, não atualiza o estado
    if dados is None:
        return {}

    # Só monta o objeto quando nome, idade e sexo não são None
    # A verificação completa das pendências ocorre no nó validar_dados
    if dados.nome is None or dados.idade is None or dados.sexo is None:
        return {}

    # Constrói o modelo Pydantic e disponibiliza-o aos nós seguintes
    return {
        "dados_paciente": DadosPaciente(
            nome=dados.nome,
            idade=dados.idade,
            sexo=dados.sexo,
        )
    }


# Organiza os dados da triagem disponíveis no resultado da extração
@observar_funcao("coletar_triagem", registrar_configurado)      # Registra a execução técnica da etapa para envio ao LangSmith, quando habilitado
def coletar_triagem_node(state: ConversationState) -> dict:
    dados = state.get("dados_extraidos")

    # Sem resultado de extração, não atualiza o estado
    if dados is None:
        return {}

    # Exige que estes campos não sejam None para montar o objeto
    # Listas vazias são permitidas, pois podem representar negativas
    # Os indicadores de resposta são considerados na validação das pendências
    if (
        dados.queixa_principal is None
        or dados.sintomas is None
        or dados.tempo_sintomas is None
        or dados.intensidade is None
        or dados.informacoes_complementares is None
    ):
        return {}

    # Disponibiliza os dados organizados aos próximos nós
    # Os indicadores internos de resposta não fazem parte de DadosTriagem
    return {
        "dados_triagem": DadosTriagem(
            queixa_principal=dados.queixa_principal,
            sintomas=dados.sintomas,
            tempo_sintomas=dados.tempo_sintomas,
            intensidade=dados.intensidade,
            informacoes_complementares=dados.informacoes_complementares,
        )
    }


# Confere se todos os campos necessários foram coletados.
@observar_funcao("validar_dados", registrar_configurado)
def validar_dados_node(state: ConversationState) -> dict:
    dados = state.get("dados_extraidos")

    # Sem dados extraídos, registra uma pendência geral
    if dados is None:
        return {
            "campos_pendentes": ["dados da conversa"],
            "finalizado": False,
        }

    # Aplica as regras de preenchimento definidas no modelo de coleta
    pendentes = dados.campos_pendentes()

    # Protege a finalização caso a idade não tenha sido identificada.
    if dados.idade is None and "idade" not in pendentes:
        pendentes.append("idade")

    # Disponibiliza as pendências para a função de roteamento
    # Sem pendências, o grafo pode avançar, mas ainda não está finalizado
    return {
        "campos_pendentes": pendentes,
        "finalizado": False,
    }


# Gera o resumo e as hipóteses clínicas em uma única chamada ao modelo.
@observar_funcao("gerar_resumo", registrar_configurado)
def gerar_resumo_node(state: ConversationState) -> dict:
    dados_paciente = state.get("dados_paciente")
    dados_triagem = state.get("dados_triagem")
    messages = state.get("messages", [])

    # Não chama o modelo se as estruturas necessárias não estiverem disponíveis.
    if dados_paciente is None or dados_triagem is None:
        return {}

    # Define as instruções específicas para gerar os resultados
    # Estas orientações não constituem uma validação clínica automática
    orientacoes = SystemMessage(
        content=(
            "Você auxilia na organização de informações para uma triagem "
            "de saúde. Gere um resumo fiel aos dados fornecidos e hipóteses "
            "clínicas iniciais justificadas pelas informações disponíveis. "
            "Não invente sintomas, duração, intensidade, antecedentes ou "
            "sinais vitais. Não transforme hipóteses em diagnósticos "
            "confirmados. Se as informações forem insuficientes, deixe essa "
            "limitação explícita. Justifique cada hipótese somente com os "
            "sintomas, duração e demais achados efetivamente relatados; "
            "identifique-a como possibilidade que exige avaliação profissional. "
            "A presença de um antecedente ou o uso de um medicamento não "
            "comprovam relação com a queixa atual: não lhes atribua causa, "
            "associação ou efeito sem evidência explícita no relato. "
            "Não transforme dados ausentes em sintomas negados, achados "
            "normais ou condições descartadas. Se não houver base suficiente "
            "para formular hipóteses, retorne uma lista vazia de hipóteses "
            "e registre a limitação no resumo. Não classifique o risco por cores, não "
            "atribua prioridade de atendimento e não prescreva tratamentos. "
            "A classificação de risco é responsabilidade de outro componente "
            "do sistema."
        )
    )

    # Acrescenta os dados organizados como referência explícita para o modelo
    # model_dump_json serializa os objetos Pydantic para texto JSON
    contexto = SystemMessage(
        content=(
            "Dados do paciente já coletados:\n"
            f"{dados_paciente.model_dump_json(indent=2)}\n\n"
            "Dados da triagem já coletados:\n"
            f"{dados_triagem.model_dump_json(indent=2)}\n\n"
            "Use esses dados como referência. Produza somente o resumo e "
            "as hipóteses clínicas iniciais no formato estruturado solicitado."
        )
    )

    # Envia as instruções, o histórico e os dados de referência
    # Uma única chamada devolve os dois componentes de ResultadoClinico
    resultado = gerar_resultado_clinico(
        [orientacoes, *messages, contexto]
    )

    # Atualiza os campos do estado que serão utilizados na montagem da ficha
    return {
        "resumo_triagem": resultado.resumo_triagem,
        "hipoteses_clinicas": resultado.hipoteses_clinicas_iniciais,
    }


# Mantém o nó no grafo atual; a geração conjunta já ocorreu acima
@observar_funcao("gerar_hipoteses", registrar_configurado)
def gerar_hipoteses_node(state: ConversationState) -> dict:
    # As hipóteses já foram produzidas junto ao resumo no nó anterior
    # Mantém esta etapa na sequência sem atualizar o estado
    return {}


# Monta a resposta final usando os dados organizados pelos nós anteriores
@observar_funcao("finalizar", registrar_configurado)
def finalizar_node(state: ConversationState) -> dict:
    # Recupera os resultados disponibilizados pelos nós anteriores
    dados_paciente = state.get("dados_paciente")
    dados_triagem = state.get("dados_triagem")
    resumo = state.get("resumo_triagem")
    hipoteses = state.get("hipoteses_clinicas")

    # Impede a conclusão se algum resultado necessário estiver ausente ou quando existem campos pendentes
    # Uma lista de hipóteses vazia é permitida: [] é diferente de None
    if (
        dados_paciente is None
        or dados_triagem is None
        or resumo is None
        or hipoteses is None
        or state.get("campos_pendentes")
    ):
        return {
            "finalizado": False,
            "resposta_final": None,
        }

    # Reúne os componentes no modelo Pydantic da resposta final
    resposta = RespostaFinal(
        dados_paciente=dados_paciente,
        dados_triagem=dados_triagem,
        resumo_triagem=resumo,
        hipoteses_clinicas_iniciais=hipoteses,
    )

    # Disponibiliza a ficha e indica sua conclusão ao controlador
    return {
        "resposta_final": resposta,
        "finalizado": True,
    }
