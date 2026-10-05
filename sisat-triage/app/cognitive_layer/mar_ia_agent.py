# Carrega as configurações definidas no arquivo .env
from dotenv import load_dotenv

load_dotenv()

from langchain_ollama import ChatOllama
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

# Cria o agente da MarIA utilizando o Llama 3 e as instruções
# gerais definidas no SYSTEM_PROMPT.
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
"""

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
# Define que a resposta usada na extração dos dados deve seguir
# a estrutura do schema DadosColetaChat.
extrator_chat_llm = llm.with_structured_output(
    DadosColetaChat,
    method="json_schema",
)
# Define que a mensagem gerada para o paciente deve seguir
# a estrutura do schema MensagemChatAgente.
mensagem_chat_llm = llm.with_structured_output(
    MensagemChatAgente,
    method="json_schema",
)
