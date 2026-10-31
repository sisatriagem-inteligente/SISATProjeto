from typing import Literal

from pydantic import BaseModel, Field, model_validator

# Resposta pública do endpoint /chat, utilizada pelo BFF
class RespostaChat(BaseModel):
    mensagem: str = Field(
        min_length=1,
        description="Próxima mensagem da MarIA para o paciente.",
    )
    # O controlador calcula este valor pelas pendências da coleta
    # Não é uma decisão delegada ao modelo de linguagem
    finalizada: bool = Field(
        description=(
            "Indica se os dados necessários para gerar a ficha final "
            "já foram coletados."
        )
    )

# Resposta interna solicitada ao modelo para gerar uma pergunta
# Diferentemente de RespostaChat, inclui o campo que o modelo declara perguntar
class MensagemChatAgente(BaseModel):
    campo_alvo: Literal[
    # Literal restringe os valores aceitos para o campo declarado
    # O controlador compara esse valor com o próximo campo pendente
        "nome",
        "idade",
        "sexo",
        "queixa principal",
        "sintomas",
        "tempo dos sintomas",
        "intensidade",
        "informações complementares",
    ] = Field(
        description="Único campo pendente que esta pergunta pretende coletar.",
    )
    # min_length exige pelo menos um caractere
    # A forma interrogativa e a repetição são verificadas no controlador
    mensagem: str = Field(
        min_length=1,
        description="Próxima mensagem da MarIA para o paciente.",
    )


class DadosColetaChat(BaseModel):
#Representa dados da coleta, que podem estar parcialmente preenchidos

    # Os campos aceitam None porque a coleta pode estar incompleta
    # Na representação JSON, None corresponde a null
    nome: str | None = Field(
        default=None,
        description="Nome explicitamente informado pelo paciente.",
    )
    # ge e le estabelecem os limites inclusivos aceitos para idade
    idade: int | None = Field(
        default=None,
        ge=0,
        le=130,
        description="Idade em anos informada pelo paciente.",
    )
    sexo: str | None = Field(
        default=None,
        description="Sexo explicitamente informado pelo paciente.",
    )
    queixa_principal: str | None = Field(
        default=None,
        description="Motivo principal do atendimento informado pelo paciente.",
    )
    # Nas listas, None e [] possuem significados diferentes:
    # None indica informação ausente; [] pode representar negativa explícita
    # O prompt orienta a extração dos itens relatados; o schema valida o formato,
    # mas não verifica semanticamente a correspondência com o histórico.
    sintomas: list[str] | None = Field(
        default=None,
        description=(
            "Use null se ainda não respondeu, [] se afirmou que não possui "
            "sintomas, ou uma lista com todos os sintomas relatados. Inclua "
            "a queixa principal quando ela for um sintoma e os demais sintomas "
            "mencionados na mesma frase. Exemplo: 'dor no estômago, "
            "acompanhada de náusea' inclui os dois itens."
        ),
    )
    # Permite considerar uma negativa válida como resposta ao campo
    # Este indicador não significa ausência de outros sintomas
    sintomas_respondidos: bool = Field(
        default=False,
        description=(
            "true se o paciente respondeu sobre seus sintomas, inclusive "
            "quando respondeu que não possui outros sintomas; false se o "
            "assunto ainda não foi respondido."
        ),
    )
    tempo_sintomas: str | None = Field(
        default=None,
        description="Duração dos sintomas, como 3 horas ou 2 dias.",
    )
    # Restringe as categorias aceitas, sem atribuir classificação de risco
    # O prompt orienta a extração; o schema restringe as categorias aceitas
    intensidade: Literal["leve", "moderada", "intensa"] | None = Field(
        default=None,
        description="Intensidade explicitamente informada pelo paciente.",
    )

    informacoes_complementares: list[str] | None = Field(
        default=None,
        description=(
            "Use null se ainda não respondeu, [] se informou que não há "
            "complementos, ou uma lista com os fatos complementares "
            "explicitamente relatados. Preserve separadamente antecedentes, "
            "condições diagnosticadas e medicamentos, incluindo a frequência "
            "de uso. Exemplo: 'tenho gastrite diagnosticada e uso omeprazol "
            "diariamente' deve gerar os itens 'gastrite diagnosticada' e "
            "'uso omeprazol diariamente'. Não traduza nem omita itens."
        ),
    )
    informacoes_complementares_respondidas: bool = Field(
        default=False,
        description=(
            "true se o paciente respondeu sobre informações complementares, "
            "inclusive quando informou que não possui; false se ainda não "
            "respondeu."
        ),
    )
    # Executa após a validação dos campos e ajusta a relação entre cada lista
    # e seu indicador. Não consulta o histórico nem comprova uma negativa
    @model_validator(mode="after")
    def normalizar_respostas_de_lista(self):
        # Cada par contém o nome do campo de lista e de seu indicador
        for lista, indicador in (
            ("sintomas", "sintomas_respondidos"),
            ("informacoes_complementares", "informacoes_complementares_respondidas"),
        ):
            # getattr acessa o atributo cujo nome está na variável lista
            valor = getattr(self, lista)
            if valor is None:
                # Um indicador isolado não confirma resposta sem uma lista
                setattr(self, indicador, False)

            elif valor:
                # Uma lista com informações explícitas comprova que o campo
                # foi respondido, mesmo se o modelo retornar o indicador False.
                setattr(self, indicador, True)

            elif indicador in self.model_fields_set and not getattr(self, indicador):
                # model_fields_set identifica os campos fornecidos
                # explicitamente na criação do objeto.
                # Uma lista vazia com False explícito permanece pendente,
                # pois não comprova que o paciente respondeu negativamente.
                if valor == []:
                    # Lista vazia com indicador explicitamente False
                    # não é tratada como uma negativa confirmada
                    setattr(self, lista, None)
            else:
                # Uma lista fornecida sem indicador explícito False
                # permite marcar o campo como respondido.
                # A confirmação pelo histórico ocorre na extração
                setattr(self, indicador, True)

        # O validador devolve o próprio objeto após os ajustes
        return self

    def combinar(self, outra: "DadosColetaChat") -> "DadosColetaChat":
        # Produz um novo objeto combinando duas coleta.
        # Nos campos simples, prioriza o valor atual quando não é None
        # Portanto, este método não substitui dados antigos por correções
        def primeiro_valido(nome):
            atual = getattr(self, nome)
            return atual if atual is not None else getattr(outra, nome)

        # Preserva None quando nenhuma das coletas possui uma lista
        sintomas = None
        if self.sintomas is not None or outra.sintomas is not None:
            # Une as listas, remove duplicados exatos e mantém a ordem
            # Uma lista vazia permanece vazia se não houver itens nas duas
            sintomas = list(dict.fromkeys(
                (self.sintomas or []) + (outra.sintomas or [])
            ))

        complementares = None
        if (
            self.informacoes_complementares is not None
            or outra.informacoes_complementares is not None
        ):
            # O mesmo processo é aplicado às informações complementares
            complementares = list(dict.fromkeys(
                (self.informacoes_complementares or [])
                + (outra.informacoes_complementares or [])
            ))

        # A criação do novo objeto também executa as validações do modelo
        # Os indicadores são combinados por OR: basta um estar True
        return DadosColetaChat(
            nome=primeiro_valido("nome"),
            idade=primeiro_valido("idade"),
            sexo=primeiro_valido("sexo"),
            queixa_principal=primeiro_valido("queixa_principal"),
            sintomas=sintomas,
            sintomas_respondidos=(
                self.sintomas_respondidos or outra.sintomas_respondidos
            ),
            tempo_sintomas=primeiro_valido("tempo_sintomas"),
            intensidade=primeiro_valido("intensidade"),
            informacoes_complementares=complementares,
            informacoes_complementares_respondidas=(
                self.informacoes_complementares_respondidas
                or outra.informacoes_complementares_respondidas
            ),
        )

    def campos_pendentes(self) -> list[str]:
        # A ordem deste dicionário define a ordem das pendências devolvidas
        # O controlador seleciona o primeiro item para a próxima pergunta
        valores = {
            "nome": bool(self.nome),

            # Idade zero é válida; por isso verificamos None, não bool(idade)
            "idade": self.idade is not None,

            "sexo": bool(self.sexo),
            "queixa principal": bool(self.queixa_principal),

            # Os indicadores permitem aceitar negativas com listas vazias
            "sintomas": self.sintomas_respondidos,

            "tempo dos sintomas": bool(self.tempo_sintomas),
            "intensidade": bool(self.intensidade),
            "informações complementares": (
                self.informacoes_complementares_respondidas
            ),
        }
        # Retorna somente os nomes dos campos considerados não respondidos
        return [campo for campo, informado in valores.items() if not informado]

# Modelos usados para organizar os dados destinados à ficha final.
# Diferentemente de DadosColetaChat, seus campos não possuem default=None
class DadosPaciente(BaseModel):
    nome: str #anotação de tipo, não atribuição de valor
    idade: int
    sexo: str

class DadosTriagem(BaseModel):
    queixa_principal: str
    sintomas: list[str]
    tempo_sintomas: str
    # Aqui o tipo é str. A restrição às três categorias está em DadosColetaChat
    intensidade: str
    informacoes_complementares: list[str]

# Parte textual do resultado gerado pelo modelo
class ResumoTriagem(BaseModel):
    resumo: str

# Define o formato de uma hipótese, sem validar sua fundamentação clínica
class HipoteseClinica(BaseModel):
    hipotese: str
    justificativa: str

# Saída solicitada na chamada que gera resumo e hipóteses em conjunto
# Não inclui os dados pessoais e de triagem, já organizados no estado
class ResultadoClinico(BaseModel):
    resumo_triagem: ResumoTriagem
    hipoteses_clinicas_iniciais: list[HipoteseClinica]

# Ficha montada no nó finalizar e devolvida pelo processamento de /triagem
class RespostaFinal(BaseModel):
    # Reúne todas as partes do resultado final da triagem.
    dados_paciente: DadosPaciente
    dados_triagem: DadosTriagem
    resumo_triagem: ResumoTriagem
    # O tipo lista permite uma resposta sem hipóteses: []
    hipoteses_clinicas_iniciais: list[HipoteseClinica]
