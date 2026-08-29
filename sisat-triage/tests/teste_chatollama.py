import time

from langchain_ollama import ChatOllama


llm = ChatOllama(
    model="llama3",
    temperature=0.2,
    max_tokens=800
)

inicio = time.perf_counter()

resposta = llm.invoke("Olá")

fim = time.perf_counter()

print("\nResposta:")
print(resposta)

print(f"\nTempo total: {fim - inicio:.3f} segundos")