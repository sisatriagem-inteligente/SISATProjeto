"""Extração compartilhada e conferência de informações explícitas do histórico.
Utilizado pelo chat e pelo grafo de triagem.
As regras reconhecem formatos específicos; não realizam avaliação clínica
nem classificação de risco.
"""
# Expressões regulares utilizadas para reconhecer padrões no texto
import re
# Recursos para normalização de caracteres Unicode
import unicodedata

from langchain_core.exceptions import OutputParserException
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.cognitive_layer.schemas import DadosColetaChat

# Prepara uma representação do texto para as comparações internas:
# uniformiza maiusculas/minusculas, remove marcas de acentuação
# e reduz sequências de espaços a um único espaço
def _texto(valor: str) -> str:
    return " ".join("".join(
        c for c in unicodedata.normalize("NFD", valor.casefold())
        if not unicodedata.combining(c)
    ).split())

# Remove espaços nas extremidades e os caracteres indicados ao final
# Não remove pontuação interna nem normaliza caixa ou acentuação
def _limpar(valor: str) -> str:
    return valor.strip().rstrip(".!? ")

# Respostas de desconhecimento ou recusa
# Elas não comprovam o preenchimento do campo perguntado
_RECUSAS = {"nao sei", "nao lembro", "prefiro nao responder", "nao quero informar",
            "nao informado", "nao tenho certeza"}

# Negativas curtas que precisam ser interpretadas junto ao contexto
# Por exemplo, "não" após uma pergunta sobre sintomas
_NEGATIVAS = {"nao", "nenhum", "nenhuma", "nao tenho", "nao possuo",
              "nao tenho nenhuma", "nao tenho nenhum", "nao tenho mais nada"}

# Reconhece algumas referências a terceiros no texto normalizado
# Nas verificações seguintes, mensagens com essas referências são
# desconsideradas como evidência dos dados do próprio paciente
_TERCEIROS = re.compile(
    r"\b(?:minha (?:mae|filha|irma|esposa|avo)|meu (?:pai|filho|irmao|marido|avo)|"
    r"ele|ela|outra pessoa)\b"
)

# Fragmento de expressão regular para quantidades numéricas
# e algumas quantidades escritas por extenso
_QUANTIDADE = r"(?:\d+(?:[.,]\d+)?|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|meia|meio)"

# Combina uma quantidade e uma unidade de tempo.
# Permite qualificadores como "cerca de" e "mais de"
_INTERVALO = (
    r"(?:(?:cerca de|aproximadamente|mais de|menos de|pelo menos)\s+)?"
    + _QUANTIDADE + r"\s*(?:minutos?|min\b|horas?|h\b|dias?|semanas?|meses?|anos?)"
)

# Reconhece duração com "há" ou referências como "desde ontem".
# IGNORECASE permite reconhecer maiúsculas e minúscula
_DURACAO = re.compile(
    r"\b(?:h[aá]\s+" + _INTERVALO + r"|desde\s+(?:anteontem|ontem|hoje))\b",
    re.IGNORECASE,
)

# Usado com fullmatch para verificar uma resposta inteira,
# como "três dias", quando a pergunta anterior solicita a duração
_INTERVALO_ISOLADO = re.compile(_INTERVALO, re.IGNORECASE)

# Reconhece declarações explícitas nas três categorias previstas.
# Exemplos: "intensidade: moderada" e "a dor está intensa",
# considerando que o texto passa pela normalização
_INTENSIDADE = re.compile(
    r"\b(?:intensidade(?:\s+da\s+dor)?\s*(?::|e|esta)?\s*|"
    r"(?:a\s+)?dor\s+(?:e|esta)\s+)(leve|moderada|intensa)\b"
)

# Identifica quais campos são mencionados por padrões na pergunta anterior
# Uma mesma pergunta pode corresponder a mais de um campo
def _contextos(pergunta: str) -> set[str]:
    q = _texto(pergunta)
    campos = set()
    # Relaciona os nomes internos dos campos às expressões reconhecidas
    regras = {
        "nome": r"\bnome\b",
        "idade": r"\bidade\b|quantos anos",
        "sexo": r"\bsexo\b",
        "queixa_principal": r"queixa principal|motivo (?:do|da) (?:atendimento|consulta)",
        "sintomas": r"(?:quais|outros|algum|possui|tem|apresenta).*sintomas?|sintomas?.*(?:apresenta|sente)",
        "tempo_sintomas": r"ha quanto tempo|desde quando|quando.*comec|tempo.*sintomas",
        "intensidade": r"\bintensidade\b",
        "informacoes_complementares": r"informac.*(?:complement|adicion)|algo.*acrescentar",
    }
    for campo, padrao in regras.items():
        if re.search(padrao, q):
            campos.add(campo)
    return campos

# Procura marcadores de negação antes da posição de uma informação
# A busca fica restrita ao trecho posterior ao último separador reconhecido
def _negado_antes(texto: str, inicio: int) -> bool:
    trecho = re.split(r"[.!?;\n]|\bmas\b", texto[:inicio])[-1]
    return bool(re.search(r"\b(?:nao|sem|nego)\b", _texto(trecho)))

# Confere a presença de um trecho nos relatos fornecidos
# A última ocorrência reconhecida determina sua confirmação
def _relatado(valor: str, relatos: list[str]) -> bool:
    """Exige trecho literal do paciente e respeita sua última negação explícita."""

# Desconsidera parênteses, caixa, acentos e diferenças de espaços
# Não traduz sinônimos nem altera a ordem das palavras
    trecho = _texto(re.sub(r"[()]", " ", valor))
    if not trecho:
        return False

    # Trata o valor como texto literal e evita correspondências
    # dentro de palavras maiores
    padrao = re.compile(r"(?<!\w)" + re.escape(trecho) + r"(?!\w)")
    confirmado = False

    # Percorre os relatos na ordem recebida
    for relato in relatos:
        normal = _texto(re.sub(r"[()]", " ", relato))

        # Cada ocorrência atualiza a confirmação, considerando
        # a presença dos marcadores de negação reconhecidos
        for match in padrao.finditer(normal):
            confirmado = not _negado_antes(normal, match.start())
    return confirmado


def conferir_historico(dados: DadosColetaChat, historico) -> DadosColetaChat:
    # Considera como evidência somente mensagens do paciente
    # Mensagens com referências reconhecidas a terceiros são descartadas integralmente desta seleção
    relatos = [m.content for m in historico if isinstance(m, HumanMessage)
               and not _TERCEIROS.search(_texto(m.content))]

    # Cria um dicionário para ajustar os valores antes de validar
    # e construir o objeto de coleta que será devolvido
    valores = dados.model_dump()

    # Mantém estes campos somente quando o valor proposto pelo modelo
    # possui correspondência textual confirmada nos relatos selecionados
    for campo in ("nome", "sexo", "queixa_principal"):
        if valores[campo] and not _relatado(valores[campo], relatos):
            valores[campo] = None

    # Desconsidera inicialmente os valores sugeridos para estes campos
    # Eles serão recuperados pelas regras específicas na passagem cronológica pelo histórico
    valores.update(idade=None, tempo_sintomas=None, intensidade=None)
    for campo in ("sintomas", "informacoes_complementares"):

        # Filtra os itens propostos pelo modelo, preservando somente
        # aqueles confirmados pela função _relatado
        itens = [v for v in (valores[campo] or []) if _relatado(v, relatos)]

        # Neste ponto, ausência de itens não comprova uma negativa
        # As negativas explícitas serão verificadas posteriormente
        valores[campo] = itens or None

        # Reconstrói o indicador conforme os itens preservados
        valores[campo + ("_respondidos" if campo == "sintomas" else "_respondidas")] = bool(itens)

    # Guarda a mensagem imediatamente anterior, não apenas a última
    # pergunta da MarIA encontrada em qualquer ponto do histórico
    anterior = None
    for mensagem in historico:
        if not isinstance(mensagem, HumanMessage):
            anterior = mensagem
            continue

        # Mantém uma versão com limpeza das extremidades e outra
        # normalizada para as comparações
        resposta = _limpar(mensagem.content)
        normal = _texto(resposta)

        # Só utiliza contexto de pergunta quando a mensagem imediatamente anterior é da MarIA
        contexto = _contextos(anterior.content) if isinstance(anterior, AIMessage) else set()
        anterior = mensagem
        if _TERCEIROS.search(normal):
            continue
        if normal in _RECUSAS:
            for campo in contexto:
                valores[campo] = None
                if campo == "sintomas":
                    valores["sintomas_respondidos"] = False
                if campo == "informacoes_complementares":
                    valores["informacoes_complementares_respondidas"] = False
            continue


        # Reconhece apresentações explícitas e delimita o trecho do nome
        nome = re.search(r"\b(?:meu nome [ée]|me chamo)\s+([^,.;!?\n]+)", resposta, re.I)


        if nome and not _negado_antes(resposta, nome.start()):
            # Evita incluir no nome a continuação de frases como
            # "me chamo Ana e tenho 35 anos"
            valores["nome"] = re.split(r"\s+(?:e\s+)?(?:tenho|sou)\b", nome[1], flags=re.I)[0].strip()
        # Reconhece idade na declaração "tenho N anos",
        # desconsiderando ocorrências com negação reconhecida
        idade = [m[1] for m in re.finditer(r"\btenho\s+(\d{1,3})\s+anos\b", normal)
                 if not _negado_antes(normal, m.start())]

         # Aceita um número isolado somente quando a pergunta anterior
        # foi reconhecida como uma solicitação de idade
        if not idade and "idade" in contexto:
            isolada = re.fullmatch(r"(\d{1,3})(?:\s+anos)?", normal)
            idade = [isolada[1]] if isolada else []
        if idade:
            valores["idade"] = int(idade[-1]) if len(set(idade)) == 1 and int(idade[-1]) <= 130 else None
        # Uma declaração reconhecida, mas não confirmada,
        # invalida o valor anterior
        elif re.search(r"\btenho\s+\d{1,3}\s+anos\b", normal):
            valores["idade"] = None

        # Recupera declarações explícitas com a palavra "sexo"
        sexo = re.search(r"\bsexo\s*(?:e\s+|:\s*)?(feminino|masculino)\b", normal)
        if sexo and not _negado_antes(normal, sexo.start()):
            valores["sexo"] = sexo[1]
        # Também aceita estas respostas diretas à pergunta sobre sexo
        elif "sexo" in contexto and normal in {"feminino", "masculino"}:
            valores["sexo"] = normal

        # Uma resposta à pergunta reconhecida sobre queixa principal
        # é preservada como texto, tirando as negativas curtas cadastradas
        if "queixa_principal" in contexto and normal not in _NEGATIVAS:
            valores["queixa_principal"] = resposta


        # Localiza as expressões de duração reconhecidas nesta mensagem
        mencoes_duracao = list(_DURACAO.finditer(resposta))

        # Desconsidera ocorrências precedidas por negação reconhecida
        duracoes = [m.group() for m in mencoes_duracao
                    if not _negado_antes(resposta, m.start())]

        # Aceita um intervalo isolado, como "três dias", quando
        # a pergunta imediatamente anterior solicita a duração
        if not duracoes and "tempo_sintomas" in contexto and _INTERVALO_ISOLADO.fullmatch(resposta):
            duracoes = [resposta]

        # Evita aproveitar apenas uma parte de alternativas
        # ou de determinados intervalos compostos
        if mencoes_duracao or duracoes or "tempo_sintomas" in contexto:

            ambigua = bool(re.search(r"\bou\b|\bhoras?\s+e\s+(?:meia|\d)", normal))
            # Exige uma única duração distinta após a normalização
            # Sem confirmação suficiente, remove o valor anterior
            valores["tempo_sintomas"] = duracoes[0] if len(set(map(_texto, duracoes))) == 1 and not ambigua else None


        # Recupera categorias de intensidade em declarações explícitas,
        # desconsiderando as ocorrências com negação reconhecida
        intensidades = [m[1] for m in _INTENSIDADE.finditer(normal)
                        if not _negado_antes(normal, m.start())]
        if "intensidade" in contexto and normal in {"leve", "moderada", "intensa"}:
            intensidades = [normal]

        # Confere se outras categorias não negadas também aparecem
        # na mensagem, evitando escolher entre alternativas
        if intensidades or "intensidade" in contexto:
            alternativas = {m.group() for m in re.finditer(r"\b(?:leve|moderada|intensa)\b", normal)
                            if not _negado_antes(normal, m.start())}
            valores["intensidade"] = intensidades[0] if len(set(intensidades)) == 1 and len(alternativas) <= 1 else None
        elif re.search(r"\b(?:dor|intensidade)\b", normal) and any(
            _negado_antes(normal, m.start())
            for m in re.finditer(r"\b(?:leve|moderada|intensa)\b", normal)
        ):
            # Uma negação reconhecida pode invalidar a intensidade anterior,
            # sem fornecer uma nova categoria para substituí-la
            valores["intensidade"] = None


        # Uma negativa curta só confirma ausência de sintomas quando
        # a pergunta anterior corresponde exclusivamente a esse campo
        negativa_sintomas = normal in _NEGATIVAS and contexto == {"sintomas"}

        # Também reconhece uma declaração completa de ausência de sintomas,
        # independentemente do contexto da pergunta anterior
        negativa_sintomas |= bool(re.fullmatch(r"nao (?:tenho|possuo|apresento) sintomas", normal))
        if negativa_sintomas:
            # Distingue uma negativa reconhecida de informação ausente
            valores["sintomas"], valores["sintomas_respondidos"] = [], True
        elif "sintomas" in contexto:
            queixa = valores["queixa_principal"]

            # Inclui a queixa na lista somente quando ela também aparece
            # confirmada na resposta atual sobre sintomas
            if queixa and _relatado(queixa, [resposta]):
                valores["sintomas"] = list(dict.fromkeys((valores["sintomas"] or []) + [queixa]))
                valores["sintomas_respondidos"] = True

        # Aplica a mesma restrição de contexto às negativas curtas sobre informações complementares
        negativa_complementos = normal in _NEGATIVAS and contexto == {"informacoes_complementares"}

        #Reconhece também algumas declarações explícitas de ausência
        # de informações complementares ou adicionais
        negativa_complementos |= bool(re.search(
            r"\b(?:nao (?:tenho|possuo) (?:nenhuma |outras? )?informacoes? "
            r"(?:complementares|adicionais)|nem informacoes? (?:complementares|adicionais))\b", normal
        ))
        if negativa_complementos:
            valores["informacoes_complementares"] = []
            valores["informacoes_complementares_respondidas"] = True
        elif "informacoes_complementares" in contexto and normal not in _NEGATIVAS:


            # Preserva a resposta direta como um único item.
            # Textos com estes marcadores de negação não entram
            # nesta recuperação, evitando tratá-los como resposta afirmativa
            if not re.search(r"\b(?:nao|nenhum|nenhuma)\b", normal):
                valores["informacoes_complementares"] = [resposta]
                valores["informacoes_complementares_respondidas"] = True


    # Confere novamente os campos após a passagem pelo histórico
    # Evita manter um valor recuperado de uma mensagem antiga quando
    # sua última ocorrência reconhecida foi negada.
    for campo in ("nome", "sexo", "queixa_principal"):
        if valores[campo] and not _relatado(valores[campo], relatos):
            valores[campo] = None

     # Reconfere os itens das listas e atualiza seus indicadores
    for campo, indicador in (("sintomas", "sintomas_respondidos"),
                             ("informacoes_complementares", "informacoes_complementares_respondidas")):
        # Listas vazias de negativas reconhecidas não entram neste bloco,preservando o indicador atribuído anteriormente
        if valores[campo]:
            valores[campo] = [v for v in valores[campo] if _relatado(v, relatos)] or None
            valores[indicador] = valores[campo] is not None

    # Recupera uma queixa ausente somente se houver um único sintoma
    # preservado e uma declaração pessoal no formato "estou com ..."
    if not valores["queixa_principal"] and len(valores["sintomas"] or []) == 1:
        sintoma = valores["sintomas"][0]
        if any(re.search(r"\bestou com\s+" + re.escape(_texto(sintoma)) + r"(?!\w)", _texto(r)) for r in relatos):
            valores["queixa_principal"] = sintoma

    # Constrói e valida o objeto devolvido pela conferência
    # Os validadores de DadosColetaChat também são executados aqui
    return DadosColetaChat.model_validate(valores)


def extrair_dados(historico, extrator) -> DadosColetaChat:
    # Importa as instruções de extração quando a função é chamada
    from app.cognitive_layer.mar_ia_agent import EXTRACAO_SYSTEM_PROMPT

    # Sem histórico, devolve uma coleta vazia sem chamar o modelo
    if not historico:
        return DadosColetaChat()

    # Combina as instruções de extração com as mensagens recebidas
    mensagens = [SystemMessage(content=EXTRACAO_SYSTEM_PROMPT), *historico]

    # Permite até duas tentativas de extração e conferência
    for tentativa in range(2):
        try:
            dados = extrator.invoke(mensagens)
            return conferir_historico(dados, historico)
        except (OutputParserException, ValueError):
            if tentativa:
                # Na segunda falha, substitui a exceção por uma mensagem
                # genérica, sem reproduzir o conteúdo da exceção original
                raise OutputParserException("Não foi possível interpretar a conversa") from None

            # Após a primeira falha, acrescenta uma instrução corretiva
            # A resposta inválida não é adicionada às mensagens
            mensagens = [*mensagens, SystemMessage(content=(
                "Releia o histórico e retorne somente informações explícitas do paciente. "
                "Use null para informações ausentes."
            ))]
