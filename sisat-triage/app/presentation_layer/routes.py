from fastapi import APIRouter

from app.cognitive_layer.schemas import RespostaChat
from app.presentation_layer.controller import processar_chat, processar_triagem
from app.presentation_layer.request_models import TriagemRequest

# Agrupa os endpoints registrados na aplicação principal.
router = APIRouter()


@router.post("/chat", response_model=RespostaChat)
def conversar_com_maria(request: TriagemRequest):
    # Processa a coleta conversacional sem executar o grafo de triagem.
    return processar_chat(request)


@router.post("/triagem")
def criar_triagem(request: TriagemRequest):
    # Executa o grafo a partir do histórico recebido para produzir a ficha.
    return processar_triagem(request)
