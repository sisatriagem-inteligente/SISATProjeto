from pydantic import BaseModel

class DadosPaciente(BaseModel):
    nome: str #anotação de tipo, não atribuição de valor
    idade: int
    sexo: str

class DadosTriagem(BaseModel):
    queixa_principal: str
    sintomas: list[str] #array
    tempo_sintomas: str
    intensidade: str
    informacoes_complementares: list[str] #array

class ResumoTriagem(BaseModel):
    resumo: str

class HipoteseClinica(BaseModel):
    hipotese: str
    justificativa: str

class RespostaFinal(BaseModel):
    dados_paciente: DadosPaciente
    dados_triagem: DadosTriagem
    resumo_triagem: ResumoTriagem
    hipoteses_clinicas_iniciais: list[HipoteseClinica]