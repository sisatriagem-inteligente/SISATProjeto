#Criar e configurar a MarIA
from dotenv import load_dotenv
import os

load_dotenv()   #carrega automaticamente o arquivo .env

from langchain_ollama import ChatOllama #utilizando o ollama
from app.cognitive_layer.prompts import SYSTEM_PROMPT
from langchain.agents import create_agent #usando um agente protno do langchain

llm = ChatOllama( #criação da llm
    model="llama3",
    temperature=0.2,
    max_tokens=800
)

agent = create_agent( #criação do agente
    model=llm,
    tools=[],
    system_prompt=SYSTEM_PROMPT
)