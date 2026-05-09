from dotenv import load_dotenv
import os

load_dotenv()

from langchain_ollama import ChatOllama
from app.cognitive_layer.prompts import SYSTEM_PROMPT
from langchain.agents import create_agent

llm = ChatOllama(
    model="llama3",
    temperature=0.2,
    max_tokens=800
)

agent = create_agent(
    model=llm,
    tools=[],
    system_prompt=SYSTEM_PROMPT
)