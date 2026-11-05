"""Diagnóstico local das chamadas ao modelo, controlado por variáveis de ambiente.

Os registros são escritos somente no terminal. O conteúdo completo das
mensagens e respostas só aparece com SISAT_LLM_DEBUG_CONTENT=1.
"""

import json
import os
import sys
from contextlib import contextmanager
from functools import wraps
from time import perf_counter


def _ativo() -> bool:
    return (
        os.getenv("SISAT_LLM_DEBUG") == "1"
        or os.getenv("SISAT_CHAT_DEBUG") == "1"
    )


def _mostrar_conteudo() -> bool:
    return _ativo() and os.getenv("SISAT_LLM_DEBUG_CONTENT") == "1"


def _texto_conteudo(valor) -> str:
    if isinstance(valor, str):
        return valor
    return json.dumps(valor, ensure_ascii=False, default=str, indent=2)


def registrar_evento(etapa: str, mensagem: str) -> None:
    """Mostra um marco técnico sem incluir dados da conversa."""
    if _ativo():
        print(f"[SISAT LLM DEBUG] [{etapa}] {mensagem}", file=sys.stderr, flush=True)


def depurar_etapa(etapa: str):
    """Mostra início, duração e falha de uma etapa sem registrar seu estado."""
    def decorar(funcao):
        @wraps(funcao)
        def executar(*args, **kwargs):
            if not _ativo():
                return funcao(*args, **kwargs)

            registrar_evento(etapa, "Início.")
            inicio = perf_counter()
            try:
                resultado = funcao(*args, **kwargs)
            except Exception as erro:
                duracao = (perf_counter() - inicio) * 1000
                registrar_evento(
                    etapa,
                    f"Falha após {duracao:.1f} ms ({type(erro).__name__}).",
                )
                raise

            duracao = (perf_counter() - inicio) * 1000
            registrar_evento(etapa, f"Concluída em {duracao:.1f} ms.")
            return resultado
        return executar
    return decorar


def registrar_saida(etapa: str, resposta) -> None:
    """Mostra a estrutura da resposta; valores só no modo detalhado."""
    if not _ativo():
        return

    if hasattr(resposta, "model_dump"):
        estrutura = resposta.model_dump(mode="json")
    elif isinstance(resposta, dict):
        estrutura = resposta
    else:
        estrutura = getattr(resposta, "content", resposta)

    if _mostrar_conteudo():
        detalhe = _texto_conteudo(estrutura)
    elif isinstance(estrutura, dict):
        detalhe = f"campos={list(estrutura.keys())}"
    else:
        detalhe = f"tipo={type(resposta).__name__}"

    print(f"[SISAT LLM DEBUG] [{etapa}] Saída: {detalhe}", file=sys.stderr, flush=True)


def registrar_chat_debug(
    dados, campos_pendentes, campo_escolhido, resposta_gerada: str,
) -> None:
    """Exibe no terminal o resumo de controle do chat, no formato do chatdebug."""
    if not _ativo():
        return

    if hasattr(dados, "model_dump"):
        dados_formatados = json.dumps(
            dados.model_dump(mode="json"), ensure_ascii=False, indent=2,
        )
    else:
        dados_formatados = _texto_conteudo(dados)

    print("=== CHAT DEBUG ===", file=sys.stderr, flush=True)
    print("DADOS EXTRAÍDOS:", file=sys.stderr, flush=True)
    print(dados_formatados, file=sys.stderr, flush=True)
    print("CAMPOS PENDENTES:", file=sys.stderr, flush=True)
    print(_texto_conteudo(campos_pendentes), file=sys.stderr, flush=True)
    print("CAMPO ESCOLHIDO:", file=sys.stderr, flush=True)
    print(_texto_conteudo(campo_escolhido), file=sys.stderr, flush=True)
    print("RESPOSTA GERADA:", file=sys.stderr, flush=True)
    print(resposta_gerada, file=sys.stderr, flush=True)
    print("=== FIM CHAT DEBUG ===", file=sys.stderr, flush=True)


@contextmanager
def registrar_chamada_llm(etapa: str, mensagens):
    """Registra entrada, duração e falha sem interferir na chamada ao modelo."""
    if not _ativo():
        yield
        return

    mensagens = list(mensagens)
    print(
        f"[SISAT LLM DEBUG] [{etapa}] Enviando {len(mensagens)} mensagem(ns) ao modelo.",
        file=sys.stderr,
        flush=True,
    )
    for indice, mensagem in enumerate(mensagens, start=1):
        papel = getattr(mensagem, "type", type(mensagem).__name__)
        conteudo = getattr(mensagem, "content", mensagem)
        texto = _texto_conteudo(conteudo)
        print(
            f"[SISAT LLM DEBUG] [{etapa}] Entrada {indice}: papel={papel}, caracteres={len(texto)}",
            file=sys.stderr,
            flush=True,
        )
        if _mostrar_conteudo():
            print(
                f"[SISAT LLM DEBUG] [{etapa}] Conteúdo da entrada {indice}:\n{texto}",
                file=sys.stderr,
                flush=True,
            )

    inicio = perf_counter()
    try:
        yield
    except Exception as erro:
        duracao = (perf_counter() - inicio) * 1000
        detalhe = (
            f"{type(erro).__name__}: {erro}"
            if _mostrar_conteudo()
            else type(erro).__name__
        )
        print(
            f"[SISAT LLM DEBUG] [{etapa}] Falha após {duracao:.1f} ms: {detalhe}",
            file=sys.stderr,
            flush=True,
        )
        raise
    else:
        duracao = (perf_counter() - inicio) * 1000
        print(
            f"[SISAT LLM DEBUG] [{etapa}] Chamada concluída em {duracao:.1f} ms.",
            file=sys.stderr,
            flush=True,
        )
