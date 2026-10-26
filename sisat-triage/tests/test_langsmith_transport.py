"""Testes de transporte com HTTP simulado, sem rede ou chave real."""

from copy import deepcopy
import json
import unittest
from unittest.mock import Mock, patch

import requests

from app.langsmith_transport import enviar_registro
from app.observability import observar_etapa


class TestTransporteLangSmith(unittest.TestCase):
    def setUp(self):
        registros = []
        with observar_etapa("teste_conexao", registros.append):
            pass
        self.registro = registros[0]
        self.projeto = "11111111-1111-4111-8111-111111111111"

    def enviar(self, registro=None, **opcoes):
        enviar_registro(
            self.registro if registro is None else registro,
            chave_api="CHAVE_FICTICIA", projeto_id=self.projeto,
            **opcoes,
        )

    @patch("app.langsmith_transport.requests.post")
    def test_desativado_por_padrao(self, post):
        self.enviar()
        post.assert_not_called()

    @patch("app.langsmith_transport.requests.post")
    def test_envia_apenas_registro_validado_sem_mutar_original(self, post):
        post.return_value.status_code = 202
        original = deepcopy(self.registro)
        self.enviar(habilitado=True)
        post.assert_called_once()
        self.assertEqual(post.call_args.args, ("https://api.smith.langchain.com/runs",))
        argumentos = post.call_args.kwargs
        self.assertEqual(argumentos["json"], {**original, "session_id": self.projeto})
        self.assertEqual(argumentos["headers"], {"x-api-key": "CHAVE_FICTICIA"})
        self.assertEqual(argumentos["timeout"], 3)
        self.assertFalse(argumentos["allow_redirects"])
        self.assertNotIn("CHAVE_FICTICIA", json.dumps(argumentos["json"]))
        self.assertEqual(self.registro, original)
        post.return_value.close.assert_called_once()

    @patch("app.langsmith_transport.requests.post")
    def test_rejeita_campos_e_conteudo_nao_permitidos(self, post):
        casos = []
        for campo in ("historico", "error", "serialized", "attachments"):
            registro = deepcopy(self.registro)
            registro[campo] = "CONTEUDO_FICTICIO"
            casos.append(registro)
        for campo in ("inputs", "outputs"):
            registro = deepcopy(self.registro)
            registro[campo] = {"texto": "CONTEUDO_FICTICIO"}
            casos.append(registro)
        registro = deepcopy(self.registro)
        registro["extra"]["metadata"]["paciente"] = "CONTEUDO_FICTICIO"
        casos.append(registro)
        registro = deepcopy(self.registro)
        registro["extra"]["runtime"] = {"conteudo": "CONTEUDO_FICTICIO"}
        casos.append(registro)
        for registro in casos:
            with self.subTest(registro=registro):
                with self.assertRaises(ValueError) as erro:
                    self.enviar(registro, habilitado=True)
                self.assertNotIn("CONTEUDO_FICTICIO", str(erro.exception))
        post.assert_not_called()

    @patch("app.langsmith_transport.requests.post")
    def test_rejeita_valores_livres_em_campos_tecnicos(self, post):
        casos = []
        for campo in ("id", "name", "run_type", "start_time", "end_time"):
            registro = deepcopy(self.registro)
            registro[campo] = "CONTEUDO_FICTICIO"
            casos.append(registro)
        for campo in ("etapa", "status", "duracao_ms"):
            registro = deepcopy(self.registro)
            registro["extra"]["metadata"][campo] = "CONTEUDO_FICTICIO"
            casos.append(registro)
        for registro in casos:
            with self.subTest(registro=registro):
                with self.assertRaises(ValueError):
                    self.enviar(registro, habilitado=True)
        post.assert_not_called()

    @patch("app.langsmith_transport.requests.post")
    def test_falha_http_nao_expoe_corpo_da_resposta(self, post):
        post.return_value.status_code = 401
        post.return_value.text = "CONTEUDO_FICTICIO_DA_RESPOSTA"
        with self.assertRaises(RuntimeError) as erro:
            self.enviar(habilitado=True)
        self.assertNotIn("CONTEUDO_FICTICIO", str(erro.exception))
        post.assert_called_once()
        post.return_value.close.assert_called_once()

    @patch("app.langsmith_transport.requests.post")
    def test_falha_de_rede_nao_expoe_excecao_original(self, post):
        post.side_effect = requests.Timeout("CHAVE_FICTICIA EM ERRO FICTICIO")
        with self.assertRaises(RuntimeError) as erro:
            self.enviar(habilitado=True)
        self.assertNotIn("CHAVE_FICTICIA", str(erro.exception))
        self.assertIsNone(erro.exception.__cause__)
        post.assert_called_once()

    @patch("app.langsmith_transport.requests.post")
    def test_falha_de_envio_nao_interrompe_operacao_observada(self, post):
        post.side_effect = requests.Timeout("Falha fictícia")
        def destino(registro):
            self.enviar(registro, habilitado=True)
        with observar_etapa("chat", destino):
            resultado = "resultado preservado"
        self.assertEqual(resultado, "resultado preservado")
        post.assert_called_once()
