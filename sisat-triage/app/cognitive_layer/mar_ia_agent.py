# Carrega as configurações definidas no arquivo .env
from dotenv import load_dotenv
import os

# Carrega as variáveis encontradas no arquivo .env
# Por padrão, não substitui variáveis já definidas no ambiente do processo
load_dotenv()

# Desativa estas opções de tracing automático antes de configurar os componentes do modelo
# O envio técnico próprio é controlado separadamente pela aplicação
for variavel in ("LANGSMITH_TRACING", "LANGCHAIN_TRACING_V2", "LANGCHAIN_TRACING"):
    os.environ[variavel] = "false"

from langchain_ollama import ChatOllama
from langchain_core.runnables import RunnableLambda
from app.cognitive_layer.prompts import SYSTEM_PROMPT
from app.cognitive_layer.schemas import DadosColetaChat, MensagemChatAgente
from langchain.agents import create_agent

# Configura o modelo de linguagem utilizado pela MarIA.
# O Llama 3 é executado localmente por meio do Ollama.
llm = ChatOllama(
    model="llama3",
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
fornecidos. A intensidade só pode ser leve, moderada ou intensa.
Para sintomas, use null se o paciente ainda não respondeu, [] se afirmou que
não possui sintomas e uma lista quando relatou um ou mais sintomas. A queixa
principal também deve constar em sintomas quando ela própria for um sintoma,
como dor de cabeça, febre ou náusea.
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
paciente, sem acrescentar rótulos, parafrasear ou juntar trechos separados.
Separe sintomas atuais de antecedentes e medicamentos. Em informações
complementares, preserve também a frequência de uso relatada.
Ausência de menção não é resposta negativa: mantenha null e indicador false.
"""
# O prompt orienta a geração, mas não garante seu cumprimento
# O módulo extraction.py confere posteriormente os dados retornados


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


# Configura a geração da pergunta com o modelo Pydantic correspondente
# A saída contém campo_alvo e mensagem, utilizados pelo controlador
mensagem_chat_llm = llm.with_structured_output(
    MensagemChatAgente,
    method="json_schema",
)
