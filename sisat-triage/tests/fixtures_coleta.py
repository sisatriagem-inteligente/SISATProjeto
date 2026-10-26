"""Históricos exclusivamente fictícios usados na auditoria e na regressão."""

from langchain_core.messages import AIMessage, HumanMessage


ANA = [
    AIMessage(content="Qual é o seu nome, idade e sexo?"),
    HumanMessage(content="Meu nome é Ana, tenho 35 anos e sou do sexo feminino."),
    AIMessage(content="Qual é a sua queixa principal?"),
    HumanMessage(content="Dor de cabeça."),
    AIMessage(content="Quais sintomas você apresenta e há quanto tempo?"),
    HumanMessage(content="Dor de cabeça há 2 horas. Não tenho outros sintomas."),
    AIMessage(content="Qual é a intensidade da dor: leve, moderada ou intensa?"),
    HumanMessage(content="Moderada."),
    AIMessage(content="Possui informações complementares?"),
    HumanMessage(content="Não tenho nenhuma."),
]

CASOS = [
    ("ana", ANA, {"nome": "Ana", "idade": 35, "sexo": "feminino",
        "queixa_principal": "Dor de cabeça", "sintomas": ["Dor de cabeça"],
        "sintomas_respondidos": True, "tempo_sintomas": "há 2 horas",
        "intensidade": "moderada", "informacoes_complementares": [],
        "informacoes_complementares_respondidas": True}),
    ("beatriz", [HumanMessage(content="Meu nome é Beatriz. Estou com dor de cabeça.")],
        {"nome": "Beatriz", "idade": None, "sexo": None,
         "queixa_principal": "dor de cabeça", "sintomas": ["dor de cabeça"],
         "tempo_sintomas": None, "intensidade": None,
         "informacoes_complementares": None,
         "informacoes_complementares_respondidas": False}),
    ("negativa", [AIMessage(content="Quais sintomas você apresenta?"),
        HumanMessage(content="Não tenho sintomas."),
        AIMessage(content="Possui informações complementares?"),
        HumanMessage(content="Não tenho nenhuma.")],
        {"nome": None, "idade": None, "sexo": None, "queixa_principal": None,
         "sintomas": [], "sintomas_respondidos": True, "tempo_sintomas": None,
         "intensidade": None, "informacoes_complementares": [],
         "informacoes_complementares_respondidas": True}),
    ("correcao", ANA + [HumanMessage(content=(
        "Corrigindo: meu nome é Ana Clara, tenho 36 anos. "
        "A dor começou há 3 horas e a intensidade é intensa."))],
        {"nome": "Ana Clara", "idade": 36, "tempo_sintomas": "há 3 horas",
         "intensidade": "intensa", "informacoes_complementares": [],
         "informacoes_complementares_respondidas": True}),
    ("ontem", [AIMessage(content="Há quanto tempo você está com os sintomas?"),
        HumanMessage(content="Desde ontem.")],
        {"nome": None, "idade": None, "sintomas": None, "tempo_sintomas": "Desde ontem",
         "intensidade": None, "informacoes_complementares": None,
         "informacoes_complementares_respondidas": False}),
    ("meia_hora", [AIMessage(content="Há quanto tempo você está com os sintomas?"),
        HumanMessage(content="Há cerca de meia hora.")],
        {"nome": None, "idade": None, "sintomas": None,
         "tempo_sintomas": "Há cerca de meia hora", "intensidade": None,
         "informacoes_complementares": None,
         "informacoes_complementares_respondidas": False}),
]
