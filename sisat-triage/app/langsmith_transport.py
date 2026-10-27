"""Validação e envio explícito de registros técnicos ao LangSmith.

Não importa os componentes clínicos da MarIA nem ativa tracing automático.
As configurações de ambiente são consultadas somente quando o destino
configurado é chamado. Importar este módulo não realiza envios.
"""

from datetime import datetime, timezone
import json
import math
import os
from uuid import UUID

import requests

# Compartilha a lista de nomes técnicos permitidos pela instrumentação
from app.observability import _ETAPAS


def _validar_hierarquia(registro: dict) -> None:
    #Confere o formato e a coerência dos identificadores de parentesco

    # Identifica quais campos de hierarquia estão presentes no registro
    campos = {"trace_id", "parent_run_id", "dotted_order"} & registro.keys()

    # Registros sem hierarquia também são permitidos
    if not campos:
        return

    # Havendo hierarquia, exige o identificador da árvore e seu caminho
    if not {"trace_id", "dotted_order"} <= campos:
        raise ValueError

    # Verifica se o identificador é um UUID válido e está no formato padrão
    if str(UUID(registro["trace_id"])) != registro["trace_id"]:
        raise ValueError

    # Cada segmento representa uma etapa: horário em UTC seguido de UUID
    segmentos = registro["dotted_order"].split(".")
    if not 1 <= len(segmentos) <= 32:
        raise ValueError

    ids = []
    for segmento in segmentos:
        # São 22 caracteres de horário e 36 de UUID
        if len(segmento) != 58:
            raise ValueError

        # Verifica se o prefixo representa uma data no formato esperado
        datetime.strptime(segmento[:22], "%Y%m%dT%H%M%S%fZ")

        identificador = segmento[22:]
        if str(UUID(identificador)) != identificador:
            raise ValueError

        ids.append(identificador)

    # O horário do último segmento deve corresponder ao início desta etapa
    inicio = datetime.fromisoformat(registro["start_time"])
    if segmentos[-1][:22] != inicio.astimezone(timezone.utc).strftime(
        "%Y%m%dT%H%M%S%fZ"
    ):
        raise ValueError

    # O caminho deve começar na raiz e terminar no registro atual
    if ids[0] != registro["trace_id"] or ids[-1] != registro["id"]:
        raise ValueError

    if len(ids) == 1:
        # Um registro raiz não deve informar pai
        if "parent_run_id" in registro:
            raise ValueError
    elif registro.get("parent_run_id") != ids[-2]:
        # Em uma etapa filha, o pai deve ser o penúltimo UUID do caminho
        raise ValueError


def _preparar_registro(registro: dict, projeto_id: str) -> dict:
    #Produz uma cópia validada, rejeitando campos fora do formato permitido

    try:
        # Cria uma cópia independente usando a representação JSON
        # allow_nan=False rejeita valores numéricos especiais nessa conversão
        copia = json.loads(json.dumps(registro, allow_nan=False))

        obrigatorios = {
            "id", "name", "run_type", "inputs", "outputs", "start_time",
            "end_time", "extra",
        }
        permitidos = obrigatorios | {
            "trace_id", "parent_run_id", "dotted_order",
        }

        # Exige os campos obrigatórios e rejeita qualquer campo adicional
        # Campos extras não são removidos silenciosamente
        if (
            type(copia) is not dict
            or not obrigatorios <= copia.keys()
            or not copia.keys() <= permitidos
        ):
            raise ValueError

        # Confere o identificador do registro e o projeto de destino
        if (
            str(UUID(copia["id"])) != copia["id"]
            or str(UUID(projeto_id)) != projeto_id
        ):
            raise ValueError

        # Entradas e saídas devem ser dicionários vazios
        # Isso impede transportar conteúdo da operação nesses campos
        if (
            type(copia["inputs"]) is not dict
            or copia["inputs"]
            or type(copia["outputs"]) is not dict
            or copia["outputs"]
        ):
            raise ValueError

        # O campo extra pode conter somente metadata
        if (
            type(copia["extra"]) is not dict
            or set(copia["extra"]) != {"metadata"}
        ):
            raise ValueError

        # Restringe os metadados aos três campos técnicos previstos
        metadados = copia["extra"]["metadata"]
        if type(metadados) is not dict or set(metadados) != {
            "etapa", "status", "duracao_ms",
        }:
            raise ValueError

        # Confere a etapa e sua correspondência com o nome do registro
        # Os tipos e os estados aceitos também são restritos
        etapa = metadados["etapa"]
        if (
            etapa not in _ETAPAS
            or copia["name"] != "sisat_" + etapa
            or copia["run_type"] != "chain"
            or metadados["status"] not in {"sucesso", "falha"}
        ):
            raise ValueError

        # Exige duração numérica, finita e não negativa
        # A verificação exata do tipo também rejeita valores booleanos
        duracao = metadados["duracao_ms"]
        if (
            type(duracao) not in (int, float)
            or not math.isfinite(duracao)
            or duracao < 0
        ):
            raise ValueError

        # Interpreta os horários e exige informação de fuso
        horarios = [
            datetime.fromisoformat(copia[campo])
            for campo in ("start_time", "end_time")
        ]
        if any(h.tzinfo is None for h in horarios) or horarios[1] < horarios[0]:
            raise ValueError

        # Confere os campos opcionais de parentesco após as verificações básicas
        _validar_hierarquia(copia)

    except (KeyError, TypeError, ValueError, OverflowError, AttributeError):
        # Devolve uma mensagem genérica sem reproduzir os valores rejeitados
        raise ValueError(
            "Registro técnico fora do formato permitido"
        ) from None

    # Acrescenta o projeto somente à cópia validada
    # session_id é o campo usado pela API para associar o registro ao projeto
    copia["session_id"] = projeto_id
    return copia


def enviar_registro(
    registro: dict, *, chave_api: str, projeto_id: str, habilitado: bool = False,
) -> None:
    """Envia um registro validado quando explicitamente habilitado.

    Não realiza novas tentativas nem imprime registros ou credenciais.
    Falhas são sinalizadas ao chamador por exceções com mensagens genéricas.
    """

    # Somente o booleano True habilita esta função de envio
    if habilitado is not True:
        return

    # Valida o registro antes de realizar qualquer requisição
    dados = _preparar_registro(registro, projeto_id)

    if not isinstance(chave_api, str) or not chave_api.strip():
        raise ValueError("Credencial do LangSmith não configurada")

    try:
        # Envia ao endpoint fixo do LangSmith
        # A chave é utilizada no cabeçalho, não no corpo do registro
        # Redirecionamentos não são seguidos automaticamente
        resposta = requests.post(
            "https://api.smith.langchain.com/runs",
            headers={"x-api-key": chave_api},
            json=dados,
            timeout=3,
            allow_redirects=False,
        )

        try:
            # Aceita somente respostas HTTP da família 2xx
            # Isso confirma a aceitação HTTP, não a visualização no painel
            if not 200 <= resposta.status_code < 300:
                raise RuntimeError(
                    "Envio técnico não aceito pelo LangSmith"
                )
        finally:
            # Libera os recursos da resposta, inclusive em caso de rejeição HTTP
            resposta.close()

    except requests.RequestException:
        # Não reproduz detalhes da exceção de rede na mensagem propagada
        raise RuntimeError(
            "Falha de comunicação com o LangSmith"
        ) from None


def registrar_configurado(registro: dict) -> None:
    #Adapta as configurações de ambiente ao envio do registro técnico

    # O envio permanece desligado, salvo quando o valor é exatamente "1".
    # Essa habilitação é independente das opções de tracing automático
    if os.environ.get("SISAT_OBSERVABILITY_ENABLED") != "1":
        return

    # Consulta as credenciais e o projeto apenas quando o envio é solicitado
    # Não utiliza triagem_id nem dados da operação para definir o destino
    enviar_registro(
        registro,
        chave_api=os.environ.get("LANGSMITH_API_KEY", ""),
        projeto_id=os.environ.get("SISAT_LANGSMITH_PROJECT_ID", ""),
        habilitado=True,
    )