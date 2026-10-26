"""Primeiro nó observado: HTTP simulado, sem Ollama ou credenciais reais."""

import json
import os
import unittest
from unittest.mock import Mock, patch

import requests

from app.cognitive_layer.nodes import validar_dados_node
from app.cognitive_layer.schemas import DadosColetaChat


class TestObservacaoDoNo(unittest.TestCase):
    def setUp(self):
        ambiente = patch.dict(os.environ, {}, clear=True)
        ambiente.start()
        self.addCleanup(ambiente.stop)
        http = patch("app.langsmith_transport.requests.post")
        self.post = http.start()
        self.addCleanup(http.stop)
        self.post.return_value.status_code = 202
        self.dados = DadosColetaChat(
            nome="PACIENTE_FICTICIO_NAO_ENVIAR", idade=35, sexo="feminino",
            queixa_principal="SINTOMA_FICTICIO_NAO_ENVIAR",
            sintomas=["SINTOMA_FICTICIO_NAO_ENVIAR"],
            tempo_sintomas="há 2 horas", intensidade="moderada",
            informacoes_complementares=[],
            informacoes_complementares_respondidas=True,
        )

    def habilitar(self):
        os.environ.update({
            "SISAT_OBSERVABILITY_ENABLED": "1",
            "SISAT_LANGSMITH_PROJECT_ID": "11111111-1111-4111-8111-111111111111",
            "LANGSMITH_API_KEY": "CHAVE_FICTICIA_NAO_ENVIAR_NO_CORPO",
        })

    def test_no_continua_sem_envio_por_padrao(self):
        resultado = validar_dados_node({"dados_extraidos": self.dados})
        self.assertEqual(resultado, {"campos_pendentes": [], "finalizado": False})
        self.post.assert_not_called()

    def test_envio_tecnico_nao_contem_estado_ou_dados(self):
        self.habilitar()
        resultado = validar_dados_node({
            "dados_extraidos": self.dados,
            "messages": ["HISTORICO_FICTICIO_NAO_ENVIAR"],
        })
        self.assertEqual(resultado, {"campos_pendentes": [], "finalizado": False})
        self.post.assert_called_once()
        corpo = self.post.call_args.kwargs["json"]
        self.assertEqual(corpo["name"], "sisat_validar_dados")
        self.assertEqual(corpo["inputs"], {})
        self.assertEqual(corpo["outputs"], {})
        self.assertEqual(corpo["extra"]["metadata"]["etapa"], "validar_dados")
        self.assertEqual(corpo["extra"]["metadata"]["status"], "sucesso")
        self.assertNotIn("NAO_ENVIAR", json.dumps(corpo))

    def test_pendencia_nao_e_erro_de_execucao_do_no(self):
        self.habilitar()
        resultado = validar_dados_node({})
        self.assertEqual(resultado, {
            "campos_pendentes": ["dados da conversa"], "finalizado": False,
        })
        self.post.assert_called_once()
        self.assertEqual(
            self.post.call_args.kwargs["json"]["extra"]["metadata"]["status"],
            "sucesso",
        )

    def test_indisponibilidade_do_destino_preserva_resultado(self):
        self.habilitar()
        self.post.side_effect = requests.Timeout("Falha de rede fictícia")
        resultado = validar_dados_node({"dados_extraidos": self.dados})
        self.assertEqual(resultado, {"campos_pendentes": [], "finalizado": False})
        self.post.assert_called_once()

    def test_excecao_do_no_e_preservada_sem_copiar_seu_texto(self):
        self.habilitar()
        erro = ValueError("RELATO_FICTICIO_NAO_ENVIAR")
        dados = Mock()
        dados.campos_pendentes.side_effect = erro
        with self.assertRaises(ValueError) as capturada:
            validar_dados_node({"dados_extraidos": dados})
        self.assertIs(capturada.exception, erro)
        self.post.assert_called_once()
        corpo = self.post.call_args.kwargs["json"]
        self.assertEqual(corpo["extra"]["metadata"]["status"], "falha")
        self.assertNotIn("NAO_ENVIAR", json.dumps(corpo))
