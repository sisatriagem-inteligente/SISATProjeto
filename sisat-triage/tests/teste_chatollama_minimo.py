import time

from langchain_ollama import ChatOllama


llm = ChatOllama(
    model="llama3"
)


inicio = time.perf_counter()

resposta = llm.invoke("Olá")

fim = time.perf_counter()

print("\nResposta:")
print(resposta.content)

print(f"\nTempo total: {fim - inicio:.3f} segundos")