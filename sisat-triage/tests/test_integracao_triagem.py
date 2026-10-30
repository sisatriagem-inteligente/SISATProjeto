import contextlib
import io
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.cognitive_layer.schemas import DadosColetaChat, ResultadoClinico
from app.cognitive_layer.graph import app as grafo
from main import app
from tests.fixtures_coleta import ANA, CASOS


class TestIntegracaoTriagem(unittest.TestCase):
    def test_chat_e_grafo_usam_extracao_estruturada(self):
        payload = {"triagem_id": "ficticia-001", "messages": [
            {"role": "assistant" if m.type == "ai" else "user", "content": m.content}
            for m in ANA
        ]}
        dados_completos = DadosColetaChat(**CASOS[0][2])
        clinico = ResultadoClinico(
            resumo_triagem={"resumo": "Resumo fictício."},
            hipoteses_clinicas_iniciais=[],
        )
        saida = io.StringIO()
        with patch("app.presentation_layer.controller.extrator_chat_llm") as chat_llm, \
             patch("app.cognitive_layer.nodes.extrator_chat_llm") as grafo_llm, \
             patch("app.cognitive_layer.nodes.gerar_resultado_clinico", return_value=clinico) as gerar, \
             contextlib.redirect_stdout(saida):
            chat_llm.invoke.return_value = dados_completos
            grafo_llm.invoke.return_value = dados_completos
            with TestClient(app) as cliente:
                chat = cliente.post("/chat", json=payload)
                triagem = cliente.post("/triagem", json=payload)
        self.assertEqual(chat.status_code, 200)
        self.assertTrue(chat.json()["finalizada"])
        self.assertEqual(triagem.status_code, 200)
        ficha = triagem.json()
        self.assertEqual(ficha["dados_paciente"]["idade"], 35)
        self.assertEqual(ficha["dados_triagem"]["tempo_sintomas"], "há 2 horas")
        self.assertEqual(ficha["dados_triagem"]["intensidade"], "moderada")
        self.assertEqual(ficha["dados_triagem"]["informacoes_complementares"], [])
        self.assertEqual(chat_llm.invoke.call_count, 1)
        self.assertEqual(grafo_llm.invoke.call_count, 1)
        self.assertEqual(gerar.call_count, 1)
        self.assertEqual(saida.getvalue(), "")

    def test_grafo_incompleto_nao_gera_resultado_clinico(self):
        with patch("app.cognitive_layer.nodes.extrator_chat_llm") as modelo, \
             patch("app.cognitive_layer.nodes.gerar_resultado_clinico") as gerar:
            modelo.invoke.return_value = DadosColetaChat()
            estado = grafo.invoke({"messages": ANA[:2]})
        self.assertFalse(estado["finalizado"])
        self.assertIsNone(estado.get("resposta_final"))
        self.assertIn("tempo dos sintomas", estado["campos_pendentes"])
        gerar.assert_not_called()
