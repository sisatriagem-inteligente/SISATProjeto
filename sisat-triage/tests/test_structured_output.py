from app.cognitive_layer.structured_output import gerar_resposta_estruturada

from langchain_core.messages import HumanMessage #LangChain trabalha com mensagens

messages = [
    HumanMessage(
        content="""
Meu nome é João.
Tenho 27 anos.
Sou do sexo masculino.

Estou com dor abdominal há cerca de 12 horas.

A dor começou depois do almoço.

Também sinto náuseas.
Tive dois episódios de vômito.
Perdi o apetite.

Não possuo doenças conhecidas.
Não faço uso de medicamentos contínuos.
"""
    )
]
resposta = gerar_resposta_estruturada(messages)

print("\n========== OBJETO ==========")
print(resposta)

print("\n========== JSON ==========")
print(resposta.model_dump())