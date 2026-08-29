from fastapi import APIRouter

from app.presentation_layer.controller import processar_triagem
from app.presentation_layer.request_models import TriagemRequest

# Cria o roteador responsável pelas rotas da camada de apresentação.
router = APIRouter()

# Recebe uma nova requisição de triagem enviada pelo sisat-bff.
@router.post("/triagem")
def criar_triagem(request: TriagemRequest):

    # Encaminha os dados recebidos para o controller,
    # que será responsável por executar o processamento da MarIA.
    return processar_triagem(request)