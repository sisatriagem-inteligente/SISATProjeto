"""Medição de etapas e criação de registros exclusivamente técnicos.

Não implementa transporte nem lê configurações de ambiente.
O destino é fornecido pelo chamador e pode armazenar ou enviar o registro.
Argumentos, resultados e conteúdo clínico não são incluídos nos registros.
"""

# Tipos usados para descrever funções recebidas e o gerenciador de contexto
from collections.abc import Callable, Iterator

# Permite implementar o bloco "with observar_etapa(...)" usando yield
from contextlib import contextmanager

# Mantém os identificadores da execução no contexto corrente
from contextvars import ContextVar

# Registra horários absolutos em UTC
from datetime import datetime, timezone

# Preserva metadados da função envolvida pelo decorador
from functools import wraps

# Mede o intervalo decorrido com um contador monotônico
from time import perf_counter

# Gera identificadores aleatórios, sem utilizar dados do paciente
from uuid import uuid4


# Restringe os nomes aceitos nos registros técnicos
# frozenset cria um conjunto imutável, evitando alterações por adição ou remoção
_ETAPAS = frozenset({
    "teste_conexao", "chat", "triagem", "extrair_dados", "coletar_paciente",
    "coletar_triagem", "validar_dados", "gerar_resumo", "gerar_hipoteses",
    "finalizar", "gerar_pergunta",
})


# Guarda somente a hierarquia técnica da etapa corrente:
# (identificador da árvore, identificador da etapa, caminho hierárquico)
# Sem contexto ativo, o valor é None
# ContextVar mantém valores separados entre contextos concorrentes
_CONTEXTO: ContextVar[tuple[str, str, str] | None] = ContextVar(
    "sisat_observacao", default=None,
)

# Permite utilizar esta função como gerenciador de contexto com "with"
@contextmanager
def observar_etapa(
    etapa: str, registrar: Callable[[dict], None], *, agrupar: bool = False,
) -> Iterator[None]:
    """Mede uma etapa permitida e entrega somente seu registro técnico.

    Exceções da operação continuam sendo propagadas, sem incluir seu conteúdo
    no registro. Falhas do destino não substituem o resultado da operação.
    """

    # Rejeita nomes fora da lista permitida antes de iniciar a observação
    if etapa not in _ETAPAS:
        raise ValueError("Etapa de observação não permitida")

    # Registra o horário e gera um identificador para esta etapa
    inicio = datetime.now(timezone.utc)
    identificador = str(uuid4())

    # Consulta a etapa externa, caso exista uma observação em andamento
    pai = _CONTEXTO.get()
    contexto = None
    token = None

    # Cria uma hierarquia quando o agrupamento foi solicitado
    # ou quando esta etapa está dentro de outra já agrupada
    if agrupar or pai is not None:
        # Combina horário e UUID no formato utilizado pelo dotted_order
        segmento = inicio.strftime("%Y%m%dT%H%M%S%fZ") + identificador

        contexto = (
            # Etapas filhas preservam o identificador da árvore principal
            pai[0] if pai else identificador,
            identificador,
            # Acrescenta o segmento atual ao caminho da etapa externa
            pai[2] + "." + segmento if pai else segmento,
        )

        # Ativa o contexto e guarda o token necessário para restaurá-lo
        token = _CONTEXTO.set(contexto)
    # Inicia a medição da operação
    contador = perf_counter()
    sucesso = False


    try:
        # Suspende esta função enquanto o bloco "with" é executado
        # Se a operação propagar uma exceção, ela retorna neste ponto
        yield
        # Só marca sucesso quando o bloco termina sem propagar uma exceção
        sucesso = True
    finally:
        # Prepara o registro tanto no sucesso quanto na falha da operação
        fim = datetime.now(timezone.utc)
        duracao_ms = round((perf_counter() - contador) * 1000, 3)


        registro = {
            "id": identificador,
            "name": "sisat_" + etapa,
            "run_type": "chain",

            # Não inclui argumentos, mensagens ou resultados da operação
            "inputs": {},
            "outputs": {},

            # Representa os horários em texto no formato ISO 8601
            "start_time": inicio.isoformat(),
            "end_time": fim.isoformat(),

            "extra": {"metadata": {
                "etapa": etapa,
                "status": "sucesso" if sucesso else "falha",
                "duracao_ms": duracao_ms,
            }},
        }

        # Acrescenta os identificadores de hierarquia quando há agrupamento
        if contexto is not None:
            registro["trace_id"] = contexto[0]
            registro["dotted_order"] = contexto[2]
            # A raiz não possui pai; etapas internas apontam à etapa extern
            if pai is not None:
                registro["parent_run_id"] = pai[1]
        try:
            # Entrega o registro técnico ao destino fornecido pelo chamador
            registrar(registro)
        except Exception:
            # Uma falha do destino não deve interromper a operação
            # nem substituir sua exceção original
            pass
        finally:
            # Restaura o contexto anterior, inclusive quando o destino falha
            if token is not None:
                _CONTEXTO.reset(token)


def observar_funcao(
    etapa: str, registrar: Callable[[dict], None], *, agrupar: bool = False,
) -> Callable[[Callable], Callable]:
    #Cria um decorador que observa a execução de uma função síncrona.

     # Recebe a função que será envolvida pela observação
    def decorar(funcao: Callable) -> Callable:
        # Preserva os metadados e a referência à função original,
        # permitindo sua identificação e inspeção pelo LangGraph
        @wraps(funcao)
        def executar(*args, **kwargs):
            # Mede a execução sem incluir argumentos ou retorno no registro
            with observar_etapa(etapa, registrar, agrupar=agrupar):
                return funcao(*args, **kwargs)
        # Devolve a função envolvida, que será chamada no lugar da original
        return executar
    return decorar
