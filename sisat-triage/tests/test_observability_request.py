"""Árvore na chamada real do controlador/grafo; modelo e HTTP simulados."""

import json
import os
import unittest
from unittest.mock import patch

from app.cognitive_layer.schemas import DadosColetaChat, MensagemChatAgente, ResultadoClinico
from app.presentation_layer.controller import processar_chat, processar_triagem
from app.presentation_layer.request_models import TriagemRequest
from tests.fixtures_coleta import ANA, CASOS


class TestArvoreDaRequisicao(unittest.TestCase):
    def setUp(self):
        ambiente = patch.dict(os.environ, {
            "SISAT_OBSERVABILITY_ENABLED": "1",
            "SISAT_LANGSMITH_PROJECT_ID": "11111111-1111-4111-8111-111111111111",
            "LANGSMITH_API_KEY": "CHAVE_FICTICIA_NAO_ENVIAR_NO_CORPO",
        }, clear=True)
        ambiente.start()
        self.addCleanup(ambiente.stop)
        http = patch("app.langsmith_transport.requests.post")
        self.post = http.start()
        self.addCleanup(http.stop)
        self.post.return_value.status_code = 202

    def registros_enviados(self):
        return [chamada.kwargs["json"] for chamada in self.post.call_args_list]

    def conferir_registros_chat(self, nomes):
        registros = self.registros_enviados()
        self.assertEqual([r["name"] for r in registros], nomes)
        raiz = registros[-1]
        self.assertEqual(raiz["name"], "sisat_chat")
        for filha in registros[:-1]:
            self.assertEqual(filha["parent_run_id"], raiz["id"])
            self.assertEqual(filha["trace_id"], raiz["id"])
        for registro in registros:
            self.assertEqual(registro["inputs"], {})
            self.assertEqual(registro["outputs"], {})
            self.assertNotIn("NAO_ENVIAR", json.dumps(registro))
            self.assertNotIn("Ana", json.dumps(registro))
        return registros

    def test_chat_incompleto_gera_pergunta_sem_enviar_conteudo(self):
        pedido = TriagemRequest(triagem_id="ID_FICTICIO_NAO_ENVIAR", messages=[
            {"role": "user", "content": "OLA_FICTICIO_NAO_ENVIAR"},
        ])
        pergunta = MensagemChatAgente(campo_alvo="nome", mensagem="Qual é seu nome?")
        with patch("app.presentation_layer.controller.extrator_chat_llm") as extrator, \
             patch("app.presentation_layer.controller.mensagem_chat_llm") as conversador:
            extrator.invoke.return_value = DadosColetaChat()
            conversador.invoke.return_value = pergunta
            resposta = processar_chat(pedido)
        self.assertFalse(resposta.finalizada)
        self.assertEqual(resposta.mensagem, pergunta.mensagem)
        extrator.invoke.assert_called_once()
        conversador.invoke.assert_called_once()
        registros = self.conferir_registros_chat([
            "sisat_extrair_dados", "sisat_gerar_pergunta", "sisat_chat",
        ])
        self.assertTrue(all(r["extra"]["metadata"]["status"] == "sucesso" for r in registros))

    def test_chat_completo_nao_gera_pergunta(self):
        pedido = TriagemRequest(triagem_id="ID_FICTICIO_NAO_ENVIAR", messages=[
            {"role": "assistant" if m.type == "ai" else "user", "content": m.content}
            for m in ANA
        ])
        with patch("app.presentation_layer.controller.extrator_chat_llm") as extrator, \
             patch("app.presentation_layer.controller.mensagem_chat_llm") as conversador:
            extrator.invoke.return_value = DadosColetaChat(**CASOS[0][2])
            resposta = processar_chat(pedido)
        self.assertTrue(resposta.finalizada)
        conversador.invoke.assert_not_called()
        self.conferir_registros_chat(["sisat_extrair_dados", "sisat_chat"])

    def test_chat_falha_extracao_preserva_resposta_de_nova_tentativa(self):
        pedido = TriagemRequest(triagem_id="ID_FICTICIO_NAO_ENVIAR", messages=[
            {"role": "user", "content": "OLA_FICTICIO_NAO_ENVIAR"},
        ])
        with patch("app.presentation_layer.controller.extrator_chat_llm") as extrator, \
             patch("app.presentation_layer.controller.mensagem_chat_llm") as conversador:
            extrator.invoke.side_effect = ValueError("ERRO_FICTICIO_NAO_ENVIAR")
            resposta = processar_chat(pedido)
        self.assertFalse(resposta.finalizada)
        self.assertIn("Não consegui interpretar", resposta.mensagem)
        self.assertEqual(extrator.invoke.call_count, 2)
        conversador.invoke.assert_not_called()
        registros = self.conferir_registros_chat(["sisat_extrair_dados", "sisat_chat"])
        self.assertEqual(registros[0]["extra"]["metadata"]["status"], "falha")
        # A resposta de tentativa é o tratamento normal já existente no chat.
        self.assertEqual(registros[-1]["extra"]["metadata"]["status"], "sucesso")

    def test_chat_falha_pergunta_preserva_duas_tentativas(self):
        pedido = TriagemRequest(triagem_id="ID_FICTICIO_NAO_ENVIAR", messages=[
            {"role": "user", "content": "OLA_FICTICIO_NAO_ENVIAR"},
        ])
        with patch("app.presentation_layer.controller.extrator_chat_llm") as extrator, \
             patch("app.presentation_layer.controller.mensagem_chat_llm") as conversador:
            extrator.invoke.return_value = DadosColetaChat()
            conversador.invoke.side_effect = ValueError("ERRO_FICTICIO_NAO_ENVIAR")
            resposta = processar_chat(pedido)
        self.assertFalse(resposta.finalizada)
        self.assertIn("Não consegui formular", resposta.mensagem)
        self.assertEqual(conversador.invoke.call_count, 2)
        registros = self.conferir_registros_chat([
            "sisat_extrair_dados", "sisat_gerar_pergunta", "sisat_gerar_pergunta", "sisat_chat",
        ])
        self.assertEqual(registros[1]["extra"]["metadata"]["status"], "falha")
        self.assertEqual(registros[2]["extra"]["metadata"]["status"], "falha")

    def test_requisicao_completa_mantem_ficha_e_agrupa_no(self):
        pedido = TriagemRequest(
            triagem_id="IDENTIFICADOR_FICTICIO_NAO_ENVIAR", messages=[
                {"role": "assistant" if m.type == "ai" else "user", "content": m.content}
                for m in ANA
            ],
        )
        dados = DadosColetaChat(**CASOS[0][2])
        clinico = ResultadoClinico(
            resumo_triagem={"resumo": "RESUMO_FICTICIO_NAO_ENVIAR"},
            hipoteses_clinicas_iniciais=[],
        )
        with patch("app.cognitive_layer.nodes.extrator_chat_llm") as extrator, \
             patch("app.cognitive_layer.nodes.gerar_resultado_clinico", return_value=clinico) as gerar:
            extrator.invoke.return_value = dados
            resposta = processar_triagem(pedido)
        self.assertEqual(resposta.dados_paciente.nome, "Ana")
        self.assertEqual(resposta.dados_triagem.tempo_sintomas, "há 2 horas")
        self.assertEqual(resposta.resumo_triagem, clinico.resumo_triagem)
        gerar.assert_called_once()
        registros = self.registros_enviados()
        self.assertEqual([r["name"] for r in registros], [
            "sisat_extrair_dados", "sisat_coletar_paciente", "sisat_coletar_triagem",
            "sisat_validar_dados", "sisat_gerar_resumo", "sisat_gerar_hipoteses",
            "sisat_finalizar", "sisat_triagem",
        ])
        raiz = registros[-1]
        self.assertEqual(raiz["extra"]["metadata"]["status"], "sucesso")
        for filha in registros[:-1]:
            self.assertEqual(filha["parent_run_id"], raiz["id"])
            self.assertEqual(filha["trace_id"], raiz["id"])
        for registro in registros:
            self.assertEqual(registro["inputs"], {})
            self.assertEqual(registro["outputs"], {})
            self.assertNotIn("NAO_ENVIAR", json.dumps(registro))
            self.assertNotIn("Ana", json.dumps(registro))

    def test_requisicao_incompleta_preserva_erro_e_registra_falha_tecnica(self):
        pedido = TriagemRequest(triagem_id="ID_FICTICIO_NAO_ENVIAR", messages=[])
        with patch("app.cognitive_layer.nodes.extrator_chat_llm") as extrator, \
             patch("app.cognitive_layer.nodes.gerar_resultado_clinico") as gerar:
            with self.assertRaisesRegex(ValueError, "Não foi possível finalizar a triagem"):
                processar_triagem(pedido)
        extrator.invoke.assert_not_called()
        gerar.assert_not_called()
        registros = self.registros_enviados()
        self.assertEqual([r["name"] for r in registros], [
            "sisat_extrair_dados", "sisat_coletar_paciente", "sisat_coletar_triagem",
            "sisat_validar_dados", "sisat_triagem",
        ])
        raiz = registros[-1]
        for filha in registros[:-1]:
            self.assertEqual(filha["parent_run_id"], raiz["id"])
            self.assertEqual(filha["trace_id"], raiz["id"])
            self.assertEqual(filha["extra"]["metadata"]["status"], "sucesso")
        self.assertEqual(raiz["extra"]["metadata"]["status"], "falha")
        for registro in registros:
            self.assertNotIn("error", registro)
            self.assertNotIn("Não foi possível", json.dumps(registro))
