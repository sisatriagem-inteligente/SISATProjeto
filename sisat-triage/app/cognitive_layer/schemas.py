from typing import Literal

from pydantic import BaseModel, Field, model_validator


class RespostaChat(BaseModel):
    # Estrutura da resposta devolvida ao backend durante a conversa.
    mensagem: str = Field(
        min_length=1,
        description="Próxima mensagem da MarIA para o paciente.",
    )
    finalizada: bool = Field(
        description=(
            "Indica se os dados necessários para gerar a ficha final "
            "já foram coletados."
        )
    )


class MensagemChatAgente(BaseModel):
    # Define qual campo a pergunta deve coletar, evitando que a MarIA
    # escolha outro assunto diferente do campo pendente.
    campo_alvo: Literal[
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
    mensagem: str = Field(
        min_length=1,
        description="Próxima mensagem da MarIA para o paciente.",
    )


class DadosColetaChat(BaseModel):
    """Dados encontrados no histórico; None representa dado ausente."""

    nome: str | None = Field(
        default=None,
        description="Nome explicitamente informado pelo paciente.",
    )
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
    sintomas: list[str] | None = Field(
        default=None,
        description=(
            "Use null se ainda não respondeu, [] se afirmou que não possui "
            "sintomas, ou uma lista com os sintomas relatados."
        ),
    )
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
    intensidade: Literal["leve", "moderada", "intensa"] | None = Field(
        default=None,
        description="Intensidade explicitamente informada pelo paciente.",
    )
    # None: não respondeu. []: afirmou que não possui complementos.
    informacoes_complementares: list[str] | None = Field(
        default=None,
        description=(
            "Use null se ainda não respondeu, [] se informou que não há "
            "complementos, ou uma lista com os complementos relatados."
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

    @model_validator(mode="after")
    def normalizar_respostas_de_lista(self):
       # Se a queixa principal já foi identificada como um sintoma,
        # adiciona essa informação à lista para evitar uma nova pergunta.
        if self.sintomas is None and self.queixa_principal:
            self.sintomas = [self.queixa_principal]
            self.sintomas_respondidos = True

        # Uma lista preenchida confirma que o paciente já respondeu.
        # Se houve uma resposta negativa, a lista vazia representa essa resposta.
        if self.sintomas is not None:
            self.sintomas_respondidos = True
        elif self.sintomas_respondidos:
            self.sintomas = []

        if self.informacoes_complementares is not None:
            self.informacoes_complementares_respondidas = True
        elif self.informacoes_complementares_respondidas:
            self.informacoes_complementares = []
        return self

    def combinar(self, outra: "DadosColetaChat") -> "DadosColetaChat":
        # Mantém o valor já encontrado e utiliza o novo somente
        # quando o campo ainda não havia sido preenchido.
        def primeiro_valido(nome):
            atual = getattr(self, nome)
            return atual if atual is not None else getattr(outra, nome)

        sintomas = None
        if self.sintomas is not None or outra.sintomas is not None:
            # Une os sintomas encontrados nas duas extrações e remove duplicados.
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
        # Verifica quais informações já foram respondidas para determinar
        # quais campos ainda precisam ser coletados na conversa.
        valores = {
            "nome": bool(self.nome),
            "idade": self.idade is not None,
            "sexo": bool(self.sexo),
            "queixa principal": bool(self.queixa_principal),
            "sintomas": self.sintomas_respondidos,
            "tempo dos sintomas": bool(self.tempo_sintomas),
            "intensidade": bool(self.intensidade),
            "informações complementares": (
                self.informacoes_complementares_respondidas
            ),
        }
        return [campo for campo, informado in valores.items() if not informado]

class DadosPaciente(BaseModel):
    nome: str #anotação de tipo, não atribuição de valor
    idade: int
    sexo: str

class DadosTriagem(BaseModel):
    queixa_principal: str
    sintomas: list[str] # Lista de sintomas identificados na triagem.
    tempo_sintomas: str
    intensidade: str
    informacoes_complementares: list[str] # Informações adicionais relatadas.
class ResumoTriagem(BaseModel):
    resumo: str

class HipoteseClinica(BaseModel):
    hipotese: str
    justificativa: str

class RespostaFinal(BaseModel):
    # Reúne todas as partes do resultado final da triagem.
    dados_paciente: DadosPaciente
    dados_triagem: DadosTriagem
    resumo_triagem: ResumoTriagem
    hipoteses_clinicas_iniciais: list[HipoteseClinica]
