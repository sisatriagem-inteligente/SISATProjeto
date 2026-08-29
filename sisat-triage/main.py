from fastapi import FastAPI
from app.presentation_layer.routes import router

# Cria a aplicação principal da FastAPI.
app = FastAPI(
    title="SISAT Triage API",
    description="API responsável pela comunicação com a camada de IA do SISAT.",
    version="1.0.0",
)


# Registra as rotas da camada de apresentação na aplicação.
app.include_router(router)