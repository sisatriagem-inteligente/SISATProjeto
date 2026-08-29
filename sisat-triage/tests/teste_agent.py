import time

from app.cognitive_layer.mar_ia_agent import agent


inicio = time.perf_counter()

resposta = agent.invoke({
    "messages": [
        {
            "role": "user",
            "content": "Olá"
        }
    ]
})

fim = time.perf_counter()

print("\nResposta:")
print(resposta)

print(f"\nTempo total: {fim - inicio:.3f} segundos")
