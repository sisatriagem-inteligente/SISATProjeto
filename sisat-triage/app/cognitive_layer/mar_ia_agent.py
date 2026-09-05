#Criar e configurar a MarIA
from dotenv import load_dotenv
import os

load_dotenv()   #carrega automaticamente o arquivo .env

from langchain_ollama import ChatOllama #utilizando o ollama
from app.cognitive_layer.prompts import SYSTEM_PROMPT
from app.cognitive_layer.schemas import DadosColetaChat, MensagemChatAgente
from langchain.agents import create_agent #usando um agente protno do langchain

llm = ChatOllama( #criação da llm
    model="llama3",
    temperature=0,
    max_tokens=800
)

agent = create_agent( #criação do agente
    model=llm,
    tools=[],
    system_prompt=SYSTEM_PROMPT
)

EXTRACAO_SYSTEM_PROMPT = """
Extraia somente informações explicitamente fornecidas pelo paciente no
histórico. Não invente, complete ou deduza dados. Use null para dado ausente.
Interprete respostas curtas usando a pergunta imediatamente anterior da MarIA.
Por exemplo, uma duração isolada após uma pergunta sobre tempo pertence ao
campo `tempo_sintomas`; aplique a mesma regra contextual a qualquer campo.
Para informações complementares, use null se o paciente ainda não respondeu,
[] se afirmou que não possui outras informações, ou uma lista com os dados
fornecidos. A intensidade só pode ser leve, moderada ou intensa.
"""

CHAT_SYSTEM_PROMPT = SYSTEM_PROMPT + """

Você receberá os dados já coletados e os campos ainda pendentes. Formule
somente a próxima mensagem ao paciente. Faça uma única pergunta objetiva sobre
um campo pendente. Não repita dados já coletados, não invente informações e não
diga que a coleta terminou.
"""

extrator_chat_llm = llm.with_structured_output(DadosColetaChat)
mensagem_chat_llm = llm.with_structured_output(MensagemChatAgente)
