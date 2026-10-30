"""Validação opcional com Ollama local; usa apenas históricos fictícios.

PowerShell: $env:SISAT_TEST_OLLAMA='1'; python -B -m unittest tests.test_ollama_regressao -v
Não habilite esta variável para a suíte determinística cotidiana.
"""

import json
import os
import time
import unittest
from urllib.parse import urlparse

from tests.fixtures_coleta import CASOS


@unittest.skipUnless(os.environ.get("SISAT_TEST_OLLAMA") == "1", "requer Ollama local e execução explícita")
class TestOllamaRegressao(unittest.TestCase):
    def test_seis_historicos_ficticios(self):
        from app.cognitive_layer.mar_ia_agent import llm, interpretar_historico

        # O teste real roda isoladamente; fecha a conexão persistente ao sair.
        self.addCleanup(llm._client._client.close)
        self.assertIn(urlparse(str(llm._client._client.base_url)).hostname,
                      {"localhost", "127.0.0.1", "::1"})
        for nome, historico, esperado in CASOS:
            with self.subTest(caso=nome):
                print(json.dumps({"iniciando": nome, "escopo": "extracao_modelo_local"}), flush=True)
                inicio = time.monotonic()
                dados = interpretar_historico(historico)
                print(json.dumps({"caso": nome, "segundos": round(time.monotonic() - inicio, 2),
                    "extraido": dados.model_dump(),
                    "pendentes": dados.campos_pendentes()}, ensure_ascii=True), flush=True)
                for campo, valor in esperado.items():
                    self.assertEqual(getattr(dados, campo), valor, campo)
