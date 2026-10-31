import unittest
from unittest.mock import Mock, patch

from fastapi.testclient import TestClient
from langchain_core.exceptions import OutputParserException
from langchain_core.messages import AIMessage, HumanMessage

from app.cognitive_layer.schemas import DadosColetaChat, MensagemChatAgente
from app.cognitive_layer.mar_ia_agent import interpretar_historico
from main import app


class TestIntegracaoChat(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_conferencia_recupera_sintoma_e_complementos_literais(self):
        historico = [HumanMessage(content=(
            "Estou com dor no estômago, acompanhada de náusea há quatro dias. "
            "Tenho gastrite diagnosticada e uso omeprazol diariamente."
        ))]
        extrator = Mock()
        extrator.invoke.return_value = DadosColetaChat(
            queixa_principal="dor no estômago",
            sintomas=["dor no estômago"],
            tempo_sintomas="4 dias",
            informacoes_complementares=[],
            informacoes_complementares_respondidas=True,
        )

        dados = interpretar_historico(historico, extrator)

        self.assertEqual(dados.sintomas, ["dor no estômago", "náusea"])
        self.assertEqual(dados.tempo_sintomas, "há quatro dias")
        self.assertEqual(
            dados.informacoes_complementares,
            ["gastrite diagnosticada", "omeprazol diariamente"],
        )
        self.assertTrue(dados.sintomas_respondidos)
        self.assertTrue(dados.informacoes_complementares_respondidas)

    def test_campo_complementar_vazio_sem_resposta_permanece_pendente(self):
        historico = [HumanMessage(content=(
            "Meu nome é Ana e estou com dor de cabeça."
        ))]
        extrator = Mock()
        extrator.invoke.return_value = DadosColetaChat(
            informacoes_complementares=[],
            informacoes_complementares_respondidas=True,
        )

        dados = interpretar_historico(historico, extrator)

        self.assertIsNone(dados.informacoes_complementares)
        self.assertFalse(dados.informacoes_complementares_respondidas)
        self.assertIn("informações complementares", dados.campos_pendentes())

    def test_negativa_explicita_confirma_campo_complementar_vazio(self):
        historico = [
            AIMessage(content="Possui informações complementares?"),
            HumanMessage(content="Não tenho nenhuma."),
        ]
        extrator = Mock()
        extrator.invoke.return_value = DadosColetaChat()

        dados = interpretar_historico(historico, extrator)

        self.assertEqual(dados.informacoes_complementares, [])
        self.assertTrue(dados.informacoes_complementares_respondidas)
        self.assertNotIn("informações complementares", dados.campos_pendentes())

    def test_recupera_sintomas_explicitos_ligados_por_e(self):
        historico = [HumanMessage(content=(
            "Estou com tosse e febre há dois dias."
        ))]
        extrator = Mock()
        extrator.invoke.return_value = DadosColetaChat(
            queixa_principal="tose",
            sintomas=[],
            sintomas_respondidos=True,
        )

        dados = interpretar_historico(historico, extrator)

        self.assertEqual(dados.sintomas, ["tosse", "febre"])
        self.assertTrue(dados.sintomas_respondidos)

    def test_remove_sintomas_duplicados_e_recupera_medicamento_a_noite(self):
        historico = [HumanMessage(content=(
            "Estou com dor de garganta acompanhada de coriza e tosse há "
            "três dias. Tenho rinite diagnosticada e uso loratadina à noite."
        ))]
        extrator = Mock()
        extrator.invoke.return_value = DadosColetaChat(
            queixa_principal="tose e febre",
            sintomas=[
                "coriza", "tosse", "coriza e tosse",
                "dor de garganta acompanhada de coriza",
            ],
            informacoes_complementares=[],
        )

        dados = interpretar_historico(historico, extrator)

        self.assertEqual(dados.sintomas, ["coriza", "tosse", "dor de garganta"])
        self.assertEqual(
            dados.informacoes_complementares,
            ["rinite diagnosticada", "loratadina à noite"],
        )

    def test_sintomas_vazios_sem_negativa_explicita_permanecem_pendentes(self):
        historico = [HumanMessage(content="Estou me sentindo indisposto.")]
        extrator = Mock()
        extrator.invoke.return_value = DadosColetaChat(
            sintomas=[],
            sintomas_respondidos=True,
        )

        dados = interpretar_historico(historico, extrator)

        self.assertIsNone(dados.sintomas)
        self.assertFalse(dados.sintomas_respondidos)
        self.assertIn("sintomas", dados.campos_pendentes())

    def test_resposta_curta_de_intensidade_usa_pergunta_imediatamente_anterior(self):
        historico = [
            HumanMessage(content="Estou com dor de cabeça."),
            HumanMessage(content="Moderada."),
        ]
        # Simula o turno imediatamente anterior da MarIA sem chamar o modelo.
        historico[-1:-1] = [AIMessage(
            content="Qual é a intensidade da dor: leve, moderada ou intensa?"
        )]
        extrator = Mock()
        extrator.invoke.return_value = DadosColetaChat()

        dados = interpretar_historico(historico, extrator)

        self.assertEqual(dados.intensidade, "moderada")
        self.assertNotIn("intensidade", dados.campos_pendentes())

    def test_regra_de_intensidade_nao_interpreta_resposta_ambigua_ou_sobrescreve(self):
        extrator = Mock()
        historico_ambigua = [
            AIMessage(content="Qual é a intensidade da dor?"),
            HumanMessage(content="Mais ou menos."),
        ]
        extrator.invoke.return_value = DadosColetaChat()
        dados_ambiguos = interpretar_historico(historico_ambigua, extrator)
        self.assertIsNone(dados_ambiguos.intensidade)

        historico_explicita = [
            AIMessage(content="Qual é a intensidade da dor?"),
            HumanMessage(content="Moderada."),
        ]
        extrator.invoke.return_value = DadosColetaChat(intensidade="intensa")
        dados_extraidos = interpretar_historico(historico_explicita, extrator)
        self.assertEqual(dados_extraidos.intensidade, "intensa")

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
                "content": (
                    "Meu nome é Guilherme, tenho 17 anos e sou do sexo masculino. "
                    "Minha queixa é dor de cabeça há três horas, intensidade moderada. "
                    "Não possuo informações complementares."
                ),
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

    def test_indicador_isolado_nao_comprova_resposta_negativa(self):
        dados = DadosColetaChat(
            sintomas_respondidos=True,
            informacoes_complementares_respondidas=True,
        )
        self.assertIsNone(dados.sintomas)
        self.assertIsNone(dados.informacoes_complementares)
        self.assertIn("sintomas", dados.campos_pendentes())
        self.assertIn(
            "informações complementares",
            dados.campos_pendentes(),
        )

    def test_queixa_sozinha_nao_confirma_resposta_sobre_sintomas(self):
        dados = DadosColetaChat(queixa_principal="dor de cabeça")
        self.assertIsNone(dados.sintomas)
        self.assertFalse(dados.sintomas_respondidos)
        self.assertIn("sintomas", dados.campos_pendentes())

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
                "content": "Meu nome é Guilherme, tenho 17 anos. A dor de cabeça é minha única queixa.",
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
                {"role": "user", "content": (
                    "Meu nome é Guilherme, tenho 17 anos e sou do sexo masculino. "
                    "Dor de cabeça, intensidade moderada. Não possuo informações complementares."
                )},
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
                {"role": "user", "content": "Meu nome é Lucas, tenho 17 anos. Estou com dor de cabeça."},
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
