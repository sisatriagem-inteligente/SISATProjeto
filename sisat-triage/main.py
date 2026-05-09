from app.cognitive_layer.mar_ia_agent import agent
from app.cognitive_layer.prompts import SYSTEM_PROMPT

# Variáveis do sistema
nome_paciente = None
sintoma = None

# Histórico da conversa
messages = [
    {
        "role": "system",
        "content": SYSTEM_PROMPT
    }
]
# Coleta do nome - que não pode ser nulo
if nome_paciente is None:
    nome_paciente = input("Digite seu nome: ")
else:
    print("Você já digitou seu nome")

messages.append({
    "role": "user",
    "content": f"Meu nome é {nome_paciente}"
})
# Coleta do sintoma - que não pode ser nulo
if sintoma is None:
    sintoma = input("Explique quais são seus sintomas: ")
else:
    print("Você já informou seus sintomas")

messages.append({
    "role": "user",
    "content": f"Seus sintomas relatados são: {sintoma}"
})


# Manda para a IA - "invocando" o agente - primeira resposta
print("Enviando para IA...")
resposta = agent.invoke({
    "messages": messages
})
print("Resposta recebida!")
texto_resposta = resposta["messages"][-1].content
print(texto_resposta)
#salva resposta inicial da IA
messages.append({
    "role": "assistant",
    "content": texto_resposta
})

#conversa continua
while True:
    mensagem_usuario = input("Você: ")
    messages.append ({
        "role": "user",
        "content": mensagem_usuario})

 #histórico atualizado
    resposta = agent.invoke({
        "messages": messages
    })

# captura resposta da IA
    texto_resposta = resposta["messages"][-1].content
    print(texto_resposta)

# salva resposta da IA no histórico
    messages.append({
        "role": "assistant",
        "content": texto_resposta
    })


