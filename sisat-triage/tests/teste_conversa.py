import time

from app.cognitive_layer.mar_ia_agent import agent


mensagens = [
    "Olá",
    "Meu nome é Gabriela.",
    "Tenho 17 anos.",
    "Estou com febre.",
    "Começou ontem.",
]


historico = []

tempos = []


for numero, mensagem in enumerate(mensagens, start=1):

    historico.append({
        "role": "user",
        "content": mensagem
    })

    print(f"\n{'=' * 50}")
    print(f"INTERAÇÃO {numero}")
    print(f"Paciente: {mensagem}")
    print("Aguardando resposta da MarIA...")

    inicio = time.perf_counter()

    resposta = agent.invoke({
        "messages": historico
    })

    fim = time.perf_counter()

    tempo = fim - inicio
    tempos.append(tempo)

    mensagem_maria = resposta["messages"][-1]

    print(f"\nMarIA: {mensagem_maria.content}")
    print(f"Tempo da resposta: {tempo:.3f} segundos")

    historico.append({
        "role": "assistant",
        "content": mensagem_maria.content
    })


print(f"\n{'=' * 50}")
print("RESUMO DOS TESTES")
print(f"{'=' * 50}")

for numero, tempo in enumerate(tempos, start=1):
    print(f"Interação {numero}: {tempo:.3f} segundos")

print(f"\nTempo total: {sum(tempos):.3f} segundos")
print(f"Tempo médio: {sum(tempos) / len(tempos):.3f} segundos")
print(f"Maior tempo: {max(tempos):.3f} segundos")
print(f"Menor tempo: {min(tempos):.3f} segundos")