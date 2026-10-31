# Carrega as configurações definidas no arquivo .env
from dotenv import load_dotenv
import os
import re
import unicodedata

# Carrega as variáveis encontradas no arquivo .env
# Por padrão, não substitui variáveis já definidas no ambiente do processo
load_dotenv()

# Desativa estas opções de tracing automático antes de configurar os componentes do modelo
# O envio técnico próprio é controlado separadamente pela aplicação
for variavel in ("LANGSMITH_TRACING", "LANGCHAIN_TRACING_V2", "LANGCHAIN_TRACING"):
    os.environ[variavel] = "false"

from langchain_ollama import ChatOllama
from langchain_core.runnables import RunnableLambda
from langchain_core.exceptions import OutputParserException
from langchain_core.messages import SystemMessage
from app.cognitive_layer.prompts import SYSTEM_PROMPT
from app.cognitive_layer.schemas import DadosColetaChat, MensagemChatAgente
from langchain.agents import create_agent

# Configura o modelo de linguagem utilizado pela MarIA.
# O Llama 3 é executado localmente por meio do Ollama.
llm = ChatOllama(
    model="llama3.2:1b",
    temperature=0,
    max_tokens=800
)

# Cria o agente da MarIA utilizando o Llama 3 e as instruções gerais definidas no SYSTEM_PROMPT
# No fluxo atual de /chat e /triagem, este objeto não é chamado:
# esses caminhos utilizam os componentes de saída estruturada diretamente.
agent = create_agent(
    model=llm,
    tools=[],
    system_prompt=SYSTEM_PROMPT
)

# Define as regras utilizadas pelo modelo para extrair do histórico
# somente as informações fornecidas pelo paciente.
EXTRACAO_SYSTEM_PROMPT = """
Extraia somente informações explicitamente fornecidas pelo paciente no
histórico. Não invente, complete ou deduza dados. Use null para dado ausente.
Interprete respostas curtas usando a pergunta imediatamente anterior da MarIA.
Por exemplo, uma duração isolada após uma pergunta sobre tempo pertence ao
campo `tempo_sintomas`; aplique a mesma regra contextual a qualquer campo.
Para informações complementares, use null se o paciente ainda não respondeu,
[] se afirmou que não possui outras informações, ou uma lista com os dados
fornecidos. Identifique antecedentes, condições diagnosticadas e medicamentos
mesmo quando o paciente os mencionar junto com os sintomas, sem usar o rótulo
"informações complementares". Por exemplo, em "Estou com dor no estômago e
náusea há quatro dias. Tenho gastrite diagnosticada e uso omeprazol
diariamente", registre separadamente "gastrite diagnosticada" e
"omeprazol diariamente". A intensidade só pode ser leve, moderada ou intensa.
Para sintomas, use null se o paciente ainda não respondeu, [] se afirmou que
não possui sintomas e uma lista quando relatou um ou mais sintomas. Inclua
separadamente todos os sintomas mencionados, mesmo quando aparecem na mesma
frase da queixa principal. Por exemplo, "dor no estômago, acompanhada de
náusea" deve incluir "dor no estômago" e "náusea" na lista. A queixa
principal também deve constar em sintomas quando ela própria for um sintoma.
Por exemplo, "Estou com tosse e febre há dois dias" deve incluir "tosse" e
"febre" como sintomas, mantendo as palavras usadas pelo paciente.
Uma resposta negativa é uma resposta válida: não mantenha o campo como null.
Não copie para os dados nenhuma informação dita apenas pela MarIA.
Defina `sintomas_respondidos` como true sempre que o paciente tiver respondido
sobre sintomas, inclusive ao dizer que não possui outros. Defina
`informacoes_complementares_respondidas` como true sempre que ele tiver
respondido sobre informações adicionais, inclusive ao dizer que não possui.
Esses indicadores representam se houve resposta, não se a lista possui itens.
Quando vários dados estiverem na mesma mensagem, leia a mensagem inteira:
não omita sintomas, antecedentes ou medicamentos explicitamente relatados.
Nas listas, use um item por informação e copie trechos literais curtos do
paciente, sem acrescentar rótulos, traduzir, parafrasear ou juntar trechos
separados. Separe sintomas atuais de informações complementares. Em
informações complementares, registre separadamente cada antecedente, condição
previamente diagnosticada e medicamento mencionado, incluindo a frequência de
uso. Por exemplo, se o paciente disser "tenho gastrite diagnosticada e uso
omeprazol diariamente", retorne dois itens: "gastrite diagnosticada" e "uso
omeprazol diariamente". Não omita o medicamento por ele aparecer na mesma
frase que um antecedente.
Ausência de menção não é resposta negativa: mantenha null e indicador false.
"""
# O prompt orienta a extração; a resposta estruturada também é validada pelo Pydantic.


# Complementa o prompt geral com regras específicas para a conversa.
# A MarIA recebe um único campo-alvo por vez e deve formular somente a pergunta correspondente a esse campo.
CHAT_SYSTEM_PROMPT = SYSTEM_PROMPT + """

Você receberá os dados já coletados e exatamente um campo que deve ser
perguntado. Formule somente a próxima mensagem ao paciente. Faça uma única
pergunta objetiva exclusivamente sobre esse campo. Não escolha outro campo,
não repita dados já coletados, não invente informações e não diga que a coleta
terminou. No campo `campo_alvo` da resposta, copie exatamente o nome do campo
que foi solicitado.
"""
# A conclusão da coleta é determinada pelo código, não pelo modelo.


# Obtém a representação JSON Schema do modelo de coleta
# Esse dicionário descreve os campos, tipos e restrições esperados
_schema_coleta_chat = DadosColetaChat.model_json_schema()

# Exige que a resposta contenha todas as chaves previstas no esquema
# A alteração é feita no dicionário, sem modificar a classe DadosColetaChat
_schema_coleta_chat["required"] = list(_schema_coleta_chat["properties"])


def _validar_coleta_chat(resposta: dict) -> DadosColetaChat:

    # Rejeita respostas que não sejam dicionários ou que omitam
    # alguma das chaves exigidas pelo esquema interno
    if not isinstance(resposta, dict) or set(_schema_coleta_chat["required"]) - resposta.keys():
        # Mantém a mensagem de erro sem reproduzir o conteúdo recebido
        raise ValueError("Extração sem todas as chaves obrigatórias")

    # Valida os valores e converte o dicionário para DadosColetaChat,
    # incluindo a execução de seus validadores
    return DadosColetaChat.model_validate(resposta)


# Configura a extração com o JSON Schema que exige todas as chaves
# Como o esquema é um dicionário, a saída também é recebida como dict
# O operador | encaminha essa saída à função de validação e conversão
extrator_chat_llm = llm.with_structured_output(
    _schema_coleta_chat,
    method="json_schema",
) | RunnableLambda(_validar_coleta_chat)


def interpretar_historico(historico, extrator=None):
    """Obtém a extração estruturada do histórico com o modelo configurado."""
    if not historico:
        return DadosColetaChat()

    modelo_extrator = extrator or extrator_chat_llm
    mensagens = [SystemMessage(content=EXTRACAO_SYSTEM_PROMPT), *historico]
    for tentativa in range(2):
        try:
            dados = modelo_extrator.invoke(mensagens)
            return _conferir_fatos_explicitos(dados, historico)
        except (OutputParserException, ValueError):
            if tentativa:
                raise OutputParserException(
                    "Não foi possível interpretar a conversa"
                ) from None
            mensagens = [
                *mensagens,
                SystemMessage(content=(
                    "Releia o histórico e retorne somente informações explícitas "
                    "do paciente. Use null para informações ausentes."
                )),
            ]


def _normalizar_texto(texto: str) -> str:
    """Normaliza caixa e acentos para comparar uma informação com o relato."""
    normalizado = unicodedata.normalize("NFKD", texto.casefold())
    return "".join(
        caractere for caractere in normalizado
        if not unicodedata.combining(caractere)
    )


def _separar_itens_sintomas(trecho: str) -> list[str]:
    """Separa sintomas coordenados e remove a ligação "acompanhado de"."""
    trecho = re.split(
        r"\s+acompanhad[oa]s?\s+de\s+", trecho, maxsplit=1,
        flags=re.IGNORECASE,
    )[0]
    return [
        item.strip()
        for item in re.split(r"\s*,\s*|\s+e\s+", trecho, flags=re.IGNORECASE)
        if item.strip()
    ]


def _recuperar_intensidade_resposta_curta(dados: DadosColetaChat, historico):
    """Usa uma resposta curta somente após uma pergunta explícita sobre intensidade."""
    if dados.intensidade is not None or len(historico) < 2:
        return dados.intensidade

    pergunta, resposta = historico[-2:]
    if (
        getattr(pergunta, "type", None) != "ai"
        or getattr(resposta, "type", None) != "human"
        or not isinstance(pergunta.content, str)
        or not isinstance(resposta.content, str)
    ):
        return dados.intensidade

    pergunta_normalizada = _normalizar_texto(pergunta.content)
    resposta_normalizada = _normalizar_texto(resposta.content).strip(" .,!?:;")
    if "intensidade" not in pergunta_normalizada or "?" not in pergunta.content:
        return dados.intensidade

    if resposta_normalizada in {"leve", "moderada", "intensa"}:
        return resposta_normalizada
    return dados.intensidade


def _conferir_fatos_explicitos(dados: DadosColetaChat, historico) -> DadosColetaChat:
    """Recupera sintomas associados e complementos escritos literalmente."""
    mensagens_paciente = [
        mensagem.content
        for mensagem in historico
        if getattr(mensagem, "type", None) == "human"
        and isinstance(mensagem.content, str)
    ]
    texto_normalizado = _normalizar_texto(" ".join(mensagens_paciente))

    # Descarta itens de lista que o modelo alterou e não aparecem no relato.
    sintomas = []
    for item in (dados.sintomas or []):
        if _normalizar_texto(item) in texto_normalizado:
            for parte in _separar_itens_sintomas(item):
                if _normalizar_texto(parte) in texto_normalizado:
                    if _normalizar_texto(parte) not in {
                        _normalizar_texto(valor) for valor in sintomas
                    }:
                        sintomas.append(parte)
    complementares = [
        item for item in (dados.informacoes_complementares or [])
        if _normalizar_texto(item) in texto_normalizado
    ]

    # Recupera durações expressas diretamente como "há quatro dias" ou
    # "faz 2 horas", caso o modelo não as retorne ou altere o trecho.
    padrao_duracao = (
        r"\b(?:há|faz)\s+(?:\d+|[a-zá-ÿ]+)\s+"
        r"(?:minutos?|horas?|dias?|semanas?|meses?)\b"
    )
    duracoes = [
        correspondencia.group(0)
        for mensagem in mensagens_paciente
        for correspondencia in re.finditer(
            padrao_duracao, mensagem, flags=re.IGNORECASE
        )
    ]

    # Recupera o sintoma depois de expressões explícitas como
    # "acompanhada de náusea", mantendo as palavras do paciente.
    padrao_sintoma_associado = (
        r"\bacompanhad[oa]s?\s+de\s+([^,.;]+?)"
        r"(?=\s+(?:há|faz)\s+|[,.;]|$)"
    )
    for mensagem in mensagens_paciente:
        for correspondencia in re.finditer(
            padrao_sintoma_associado, mensagem, flags=re.IGNORECASE
        ):
            for item in _separar_itens_sintomas(correspondencia.group(1)):
                if _normalizar_texto(item) not in {
                    _normalizar_texto(valor) for valor in sintomas
                }:
                    sintomas.append(item)

    # Recupera itens em frases afirmativas simples como "estou com tosse e
    # febre há dois dias". A regra só divide a fala nos conectores mais comuns.
    padrao_sintomas_explicitos = (
        r"\b(?:estou\s+com|estou\s+sentindo|sinto|apresento)\s+(.+?)"
        r"(?=\s+(?:há|faz|desde)\s+|[,.;]|$)"
    )
    for mensagem in mensagens_paciente:
        for correspondencia in re.finditer(
            padrao_sintomas_explicitos, mensagem, flags=re.IGNORECASE
        ):
            for item in _separar_itens_sintomas(correspondencia.group(1)):
                if _normalizar_texto(item) in texto_normalizado:
                    itens_existentes = {
                        _normalizar_texto(valor) for valor in sintomas
                    }
                    if _normalizar_texto(item) not in itens_existentes:
                        sintomas.append(item)

    # Procura antecedentes e medicamentos em seções explicitamente citadas.
    padrao_secao = (
        r"(?:informações complementares|antecedentes|histórico médico)"
        r"\s*[:,]?\s*(.+)"
    )
    padroes_complementares = (
        r"\b(?:tenho|possuo)\s+(.+?)"
        r"(?=\s+e\s+(?:uso|tomo|utilizo)\b|[,.;]|$)",
        r"\b(?:uso|tomo|utilizo)\s+(.+?)(?=[,.;]|$)",
    )
    for mensagem in mensagens_paciente:
        secao = re.search(padrao_secao, mensagem, flags=re.IGNORECASE)
        if not secao:
            continue
        for indice_padrao, padrao in enumerate(padroes_complementares):
            for correspondencia in re.finditer(
                padrao, secao.group(1), flags=re.IGNORECASE
            ):
                if indice_padrao == 0 and re.search(
                    r"\b(?:não|nao)\s+$",
                    secao.group(1)[:correspondencia.start()],
                    flags=re.IGNORECASE,
                ):
                    # Não converte uma resposta negativa em item de informação.
                    continue
                item = correspondencia.group(1).strip()
                itens_existentes = {
                    _normalizar_texto(valor) for valor in complementares
                }
                if item and _normalizar_texto(item) not in itens_existentes:
                    complementares.append(item)

    # Também recupera fatos explícitos sem exigir que o paciente diga
    # "informações complementares": diagnóstico declarado e medicamento
    # mencionado com frequência de uso são preservados como itens separados.
    padroes_fatos_explicitos = (
        r"\b(?:tenho|possuo)\s+([^,.;]+?\s+diagnosticad[oa]s?)\b",
        r"\b(?:uso|tomo|utilizo)\s+([^,.;]+?\b(?:diariamente|todos os dias|"
        r"uma vez ao dia|duas vezes ao dia|a cada \d+ horas?|"
        r"(?:à|a) noite|pela manhã|pela tarde|de manhã|antes de dormir))\b",
    )
    for mensagem in mensagens_paciente:
        for padrao in padroes_fatos_explicitos:
            for correspondencia in re.finditer(
                padrao, mensagem, flags=re.IGNORECASE
            ):
                item = correspondencia.group(1).strip()
                itens_existentes = {
                    _normalizar_texto(valor) for valor in complementares
                }
                if item and _normalizar_texto(item) not in itens_existentes:
                    complementares.append(item)

    # Uma lista vazia só confirma a resposta quando o paciente nega
    # complementos depois de uma pergunta correspondente da MarIA.
    resposta_negativa_complementar = False
    for pergunta, resposta in zip(historico, historico[1:]):
        if (
            getattr(pergunta, "type", None) != "ai"
            or getattr(resposta, "type", None) != "human"
            or not isinstance(pergunta.content, str)
            or not isinstance(resposta.content, str)
        ):
            continue
        pergunta_normalizada = _normalizar_texto(pergunta.content)
        resposta_normalizada = _normalizar_texto(resposta.content).strip(
            " .,!?:;"
        )
        pergunta_sobre_complementos = any(
            termo in pergunta_normalizada
            for termo in (
                "informacoes complementares",
                "informacoes adicionais",
                "antecedentes",
                "medicamentos",
            )
        )
        resposta_negativa = re.fullmatch(
            r"(?:nao (?:tenho|possuo|uso|tomo|utilizo)"
            r"(?:\s+(?:nenhuma?|nenhum|nada))?|nenhuma?|nenhum|nada)"
            r"(?:\s+(?:outras?\s+)?"
            r"(?:informacoes?|antecedentes?|medicamentos?))?",
            resposta_normalizada,
        )
        if pergunta_sobre_complementos and resposta_negativa:
            resposta_negativa_complementar = True
            break
    if not resposta_negativa_complementar:
        # Também aceita uma negativa explícita incluída espontaneamente
        # na mesma mensagem dos demais dados, sem pergunta anterior da MarIA.
        resposta_negativa_complementar = any(
            re.search(
                r"\bnao (?:tenho|possuo|uso|tomo|utilizo)\s+"
                r"(?:(?:nenhuma?|nenhum|outras?|nada)\s+)?"
                r"(?:informacoes? complementares?|informacoes? adicionais?|"
                r"antecedentes?|medicamentos?)\b",
                _normalizar_texto(mensagem),
            )
            for mensagem in mensagens_paciente
        )

    atualizacao = dados.model_dump()
    if duracoes and (
        dados.tempo_sintomas is None
        or _normalizar_texto(dados.tempo_sintomas) not in texto_normalizado
    ):
        atualizacao["tempo_sintomas"] = duracoes[-1]
    resposta_negativa_sintomas = False
    for pergunta, resposta in zip(historico, historico[1:]):
        if (
            getattr(pergunta, "type", None) == "ai"
            and getattr(resposta, "type", None) == "human"
            and isinstance(pergunta.content, str)
            and isinstance(resposta.content, str)
            and "sintoma" in _normalizar_texto(pergunta.content)
        ):
            resposta_normalizada = _normalizar_texto(resposta.content).strip(
                " .,!?:;"
            )
            if resposta_normalizada in {
                "nenhum", "nenhuma", "nao tenho sintomas",
                "nao apresento sintomas", "nao sinto sintomas",
                "nao tenho nenhum sintoma", "nao tenho nenhuma sintoma",
            }:
                resposta_negativa_sintomas = True
                break
    if not resposta_negativa_sintomas:
        resposta_negativa_sintomas = any(
            re.search(
                r"\b(?:nao tenho|nao apresento|nao sinto)\s+"
                r"(?:nenhum(?:a)?\s+)?sintomas?\b|\bsem sintomas\b",
                _normalizar_texto(mensagem),
            )
            for mensagem in mensagens_paciente
        )
    if sintomas:
        atualizacao["sintomas"] = sintomas
        atualizacao["sintomas_respondidos"] = True
    elif resposta_negativa_sintomas:
        atualizacao["sintomas"] = []
        atualizacao["sintomas_respondidos"] = True
    else:
        atualizacao["sintomas"] = None
        atualizacao["sintomas_respondidos"] = False
    if complementares:
        atualizacao["informacoes_complementares"] = complementares
        atualizacao["informacoes_complementares_respondidas"] = True
    elif resposta_negativa_complementar:
        atualizacao["informacoes_complementares"] = []
        atualizacao["informacoes_complementares_respondidas"] = True
    else:
        atualizacao["informacoes_complementares"] = None
        atualizacao["informacoes_complementares_respondidas"] = False
    intensidade_curta = _recuperar_intensidade_resposta_curta(dados, historico)
    if intensidade_curta is not None:
        atualizacao["intensidade"] = intensidade_curta
    if sintomas:
        atualizacao["sintomas_respondidos"] = True
    return DadosColetaChat.model_validate(atualizacao)


# Configura a geração da pergunta com o modelo Pydantic correspondente
# A saída contém campo_alvo e mensagem, utilizados pelo controlador
mensagem_chat_llm = llm.with_structured_output(
    MensagemChatAgente,
    method="json_schema",
)
