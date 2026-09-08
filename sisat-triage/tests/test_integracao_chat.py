import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from langchain_core.exceptions import OutputParserException

from app.cognitive_layer.schemas import DadosColetaChat, MensagemChatAgente
from main import app


class TestIntegracaoChat(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("app.presentation_layer.controller.mensagem_chat_llm")
    @patch("app.presentation_layer.controller.extrator_chat_llm")
    def test_envia_historico_e_pergunta_somente_se_faltar_dado(
        self,
        extrator,
        conversador,
    ):
        extrator.invoke.return_value = DadosColetaChat(
            nome="Lucas",
            idade=17,
            queixa_principal="dor de cabeça",
            sintomas=["dor de cabeça"],
        )
        conversador.invoke.return_value = MensagemChatAgente(
            campo_alvo="sexo",
            mensagem="Qual é o seu sexo?"
        )

        resposta = self.client.post("/chat", json={
            "triagem_id": "triagem-001",
            "messages": [
                {"role": "user", "content": "Meu nome é Lucas."},
                {"role": "assistant", "content": "Qual é a sua idade?"},
                {"role": "user", "content": "Tenho 17 anos."},
            ],
        })

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.json(), {
            "mensagem": "Qual é o seu sexo?",
            "finalizada": False,
        })
        historico_extracao = extrator.invoke.call_args_list[0].args[0]
        self.assertEqual(
            [mensagem.content for mensagem in historico_extracao[1:]],
            ["Meu nome é Lucas.", "Qual é a sua idade?", "Tenho 17 anos."],
        )
        contexto = conversador.invoke.call_args.args[0][-1].content
        self.assertIn("sexo", contexto)
        self.assertIn("Lucas", contexto)
        self.assertEqual(extrator.invoke.call_count, 1)

    @patch("app.presentation_layer.controller.mensagem_chat_llm")
    @patch("app.presentation_layer.controller.extrator_chat_llm")
    def test_finalizacao_e_calculada_pelos_dados(
        self,
        extrator,
        conversador,
    ):
        extrator.invoke.return_value = DadosColetaChat(
            nome="Guilherme",
            idade=17,
            sexo="masculino",
            queixa_principal="dor de cabeça",
            sintomas=["dor de cabeça"],
            tempo_sintomas="três horas",
            intensidade="moderada",
            informacoes_complementares=[],
        )

        resposta = self.client.post("/chat", json={
            "triagem_id": "triagem-002",
            "messages": [{
                "role": "user",
                "content": "Informei todos os dados e não tenho mais nada.",
            }],
        })

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.json(), {
            "mensagem": "Obrigada pelas informações. A coleta foi concluída.",
            "finalizada": True,
        })
        conversador.invoke.assert_not_called()

    @patch("app.presentation_layer.controller.mensagem_chat_llm")
    @patch("app.presentation_layer.controller.extrator_chat_llm")
    def test_lista_vazia_de_complementos_significa_resposta_explicita(
        self,
        extrator,
        conversador,
    ):
        dados = DadosColetaChat(informacoes_complementares=[])
        self.assertNotIn("informações complementares", dados.campos_pendentes())
        dados_ausentes = DadosColetaChat()
        self.assertIn(
            "informações complementares",
            dados_ausentes.campos_pendentes(),
        )

    def test_lista_vazia_de_sintomas_significa_resposta_explicita(self):
        dados = DadosColetaChat(sintomas=[])
        self.assertNotIn("sintomas", dados.campos_pendentes())
        self.assertIn("sintomas", DadosColetaChat().campos_pendentes())

    def test_indicador_negativo_converte_valor_ausente_em_lista_vazia(self):
        dados = DadosColetaChat(
            sintomas_respondidos=True,
            informacoes_complementares_respondidas=True,
        )
        self.assertEqual(dados.sintomas, [])
        self.assertEqual(dados.informacoes_complementares, [])
        self.assertNotIn("sintomas", dados.campos_pendentes())
        self.assertNotIn(
            "informações complementares",
            dados.campos_pendentes(),
        )

    def test_queixa_principal_compõe_sintomas_quando_lista_for_omitida(self):
        dados = DadosColetaChat(queixa_principal="dor de cabeça")
        self.assertEqual(dados.sintomas, ["dor de cabeça"])
        self.assertTrue(dados.sintomas_respondidos)
        self.assertNotIn("sintomas", dados.campos_pendentes())

    @patch("app.presentation_layer.controller.mensagem_chat_llm")
    @patch("app.presentation_layer.controller.extrator_chat_llm")
    def test_usa_pergunta_generica_se_modelo_falhar_duas_vezes(
        self,
        extrator,
        conversador,
    ):
        extrator.invoke.return_value = DadosColetaChat(nome="Lucas")
        conversador.invoke.side_effect = [
            MensagemChatAgente(
                campo_alvo="sexo",
                mensagem="Qual é o seu sexo?",
            ),
            MensagemChatAgente(
                campo_alvo="sexo",
                mensagem="Informe seu sexo",
            ),
        ]

        resposta = self.client.post("/chat", json={
            "triagem_id": "triagem-fallback",
            "messages": [{"role": "user", "content": "Sou Lucas."}],
        })

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(
            resposta.json()["mensagem"],
            "Ainda preciso saber sobre idade. Você pode informar?",
        )
        self.assertFalse(resposta.json()["finalizada"])

    @patch("app.presentation_layer.controller.mensagem_chat_llm")
    @patch("app.presentation_layer.controller.extrator_chat_llm")
    def test_repete_extracao_quando_json_for_invalido(
        self,
        extrator,
        conversador,
    ):
        extrator.invoke.side_effect = [
            OutputParserException("JSON inválido"),
            DadosColetaChat(nome="Lucas"),
        ]
        conversador.invoke.return_value = MensagemChatAgente(
            campo_alvo="idade",
            mensagem="Qual é a sua idade?"
        )

        resposta = self.client.post("/chat", json={
            "triagem_id": "triagem-003",
            "messages": [{"role": "user", "content": "Sou Lucas."}],
        })

        self.assertEqual(resposta.status_code, 200)
        self.assertFalse(resposta.json()["finalizada"])
        self.assertEqual(extrator.invoke.call_count, 2)

    @patch("app.presentation_layer.controller.mensagem_chat_llm")
    @patch("app.presentation_layer.controller.extrator_chat_llm")
    def test_nao_retorna_500_se_extracao_falhar_duas_vezes(
        self,
        extrator,
        conversador,
    ):
        extrator.invoke.side_effect = OutputParserException("JSON inválido")

        resposta = self.client.post("/chat", json={
            "triagem_id": "triagem-004",
            "messages": [{"role": "user", "content": "Estou com dor."}],
        })

        self.assertEqual(resposta.status_code, 200)
        self.assertFalse(resposta.json()["finalizada"])
        self.assertEqual(extrator.invoke.call_count, 2)
        conversador.invoke.assert_not_called()

    @patch("app.presentation_layer.controller.mensagem_chat_llm")
    @patch("app.presentation_layer.controller.extrator_chat_llm")
    def test_repete_quando_mensagem_nao_for_pergunta(
        self,
        extrator,
        conversador,
    ):
        extrator.invoke.return_value = DadosColetaChat(
            nome="Guilherme",
            idade=17,
            queixa_principal="dor de cabeça",
            sintomas=["dor de cabeça"],
        )
        conversador.invoke.side_effect = [
            MensagemChatAgente(
                campo_alvo="sexo",
                mensagem="A dor de cabeça é minha única queixa",
            ),
            MensagemChatAgente(
                campo_alvo="sexo",
                mensagem="Qual é o seu sexo?",
            ),
        ]

        resposta = self.client.post("/chat", json={
            "triagem_id": "triagem-005",
            "messages": [{
                "role": "user",
                "content": "A dor de cabeça é minha única queixa.",
            }],
        })

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.json()["mensagem"], "Qual é o seu sexo?")
        self.assertFalse(resposta.json()["finalizada"])
        self.assertEqual(conversador.invoke.call_count, 2)

    @patch("app.presentation_layer.controller.mensagem_chat_llm")
    @patch("app.presentation_layer.controller.extrator_chat_llm")
    def test_nao_faz_segunda_extracao_quando_a_primeira_e_valida(
        self,
        extrator,
        conversador,
    ):
        primeira = DadosColetaChat(
            nome="Guilherme",
            idade=17,
            sexo="masculino",
            queixa_principal="dor de cabeça",
            sintomas=["dor de cabeça"],
            intensidade="moderada",
            informacoes_complementares=[],
        )
        primeira.tempo_sintomas = "3 dias"
        extrator.invoke.return_value = primeira

        resposta = self.client.post("/chat", json={
            "triagem_id": "triagem-006",
            "messages": [
                {"role": "assistant", "content": "Há quanto tempo?"},
                {"role": "user", "content": "3 dias."},
            ],
        })

        self.assertEqual(resposta.status_code, 200)
        self.assertTrue(resposta.json()["finalizada"])
        self.assertEqual(extrator.invoke.call_count, 1)
        conversador.invoke.assert_not_called()

    @patch("app.presentation_layer.controller.mensagem_chat_llm")
    @patch("app.presentation_layer.controller.extrator_chat_llm")
    def test_rejeita_pergunta_igual_a_ultima_e_tenta_novamente(
        self,
        extrator,
        conversador,
    ):
        extrator.invoke.return_value = DadosColetaChat(
            nome="Lucas",
            idade=17,
            queixa_principal="dor de cabeça",
            sintomas=["dor de cabeça"],
        )
        conversador.invoke.side_effect = [
            MensagemChatAgente(
                campo_alvo="sexo",
                mensagem="Qual é o seu sexo?",
            ),
            MensagemChatAgente(
                campo_alvo="sexo",
                mensagem="Como você informa o seu sexo?",
            ),
        ]

        resposta = self.client.post("/chat", json={
            "triagem_id": "triagem-007",
            "messages": [
                {"role": "assistant", "content": "Qual é o seu sexo?"},
                {"role": "user", "content": "Prefiro não responder."},
            ],
        })

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(
            resposta.json()["mensagem"],
            "Como você informa o seu sexo?",
        )
        self.assertEqual(conversador.invoke.call_count, 2)

    @patch("app.presentation_layer.controller.mensagem_chat_llm")
    @patch("app.presentation_layer.controller.extrator_chat_llm")
    def test_rejeita_pergunta_sobre_campo_diferente_do_solicitado(
        self,
        extrator,
        conversador,
    ):
        extrator.invoke.return_value = DadosColetaChat(nome="Lucas")
        conversador.invoke.side_effect = [
            MensagemChatAgente(
                campo_alvo="sexo",
                mensagem="Qual é o seu sexo?",
            ),
            MensagemChatAgente(
                campo_alvo="idade",
                mensagem="Qual é a sua idade?",
            ),
        ]

        resposta = self.client.post("/chat", json={
            "triagem_id": "triagem-008",
            "messages": [{"role": "user", "content": "Sou Lucas."}],
        })

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.json()["mensagem"], "Qual é a sua idade?")
        self.assertEqual(conversador.invoke.call_count, 2)


if __name__ == "__main__":
    unittest.main()
