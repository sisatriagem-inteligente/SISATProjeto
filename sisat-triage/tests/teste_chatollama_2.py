import time

from langchain_ollama import ChatOllama


llm = ChatOllama(
    model="llama3",
    temperature=0.2,
    max_tokens=800
)


print("=== PRIMEIRA CHAMADA ===")

inicio = time.perf_counter()

resposta1 = llm.invoke("Olá")

fim = time.perf_counter()

print(resposta1.content)
print(f"Tempo: {fim - inicio:.3f} segundos")


print("\n=== SEGUNDA CHAMADA ===")

inicio = time.perf_counter()

resposta2 = llm.invoke("Tudo bem?")

fim = time.perf_counter()

print(resposta2.content)
print(f"Tempo: {fim - inicio:.3f} segundos")