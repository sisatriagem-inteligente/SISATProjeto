from pydantic import BaseModel # Base utilizada pelo Pydantic para validar automaticamente os dados recebidos pela API
from typing import List

# Representa uma única mensagem enviada durante a conversa entre o paciente e a MarIA
class MensagemRequest(BaseModel):
    role: str
    content: str

# Representa a requisição enviada pelo sisat-bff contendo a identificação da triagem e o histórico da conversa da MarIA
class TriagemRequest(BaseModel):
    triagem_id: str
    messages: List[MensagemRequest]