import time

import ollama


inicio = time.perf_counter()

resposta = ollama.chat(
    model="llama3",
    messages=[
        {
            "role": "user",
            "content": "Olá"
        }
    ]
)

fim = time.perf_counter()

print("\nResposta:")
print(resposta["message"]["content"])

print(f"\nTempo total: {fim - inicio:.3f} segundos")