import unittest

from app.cognitive_layer.schemas import DadosColetaChat


class TestColetaSchema(unittest.TestCase):
    def test_queixa_nao_confirma_sintomas(self):
        dados = DadosColetaChat(queixa_principal="Solicitação de documento")
        self.assertIsNone(dados.sintomas)
        self.assertIn("sintomas", dados.campos_pendentes())

    def test_indicador_sem_lista_nao_inventa_negativa(self):
        dados = DadosColetaChat(informacoes_complementares_respondidas=True)
        self.assertIsNone(dados.informacoes_complementares)
        self.assertFalse(dados.informacoes_complementares_respondidas)

    def test_lista_vazia_com_false_explicito_continua_pendente(self):
        dados = DadosColetaChat(
            informacoes_complementares=[],
            informacoes_complementares_respondidas=False,
        )
        self.assertIsNone(dados.informacoes_complementares)
        self.assertIn("informações complementares", dados.campos_pendentes())

    def test_lista_preenchida_com_false_explicito_e_considerada_respondida(self):
        dados = DadosColetaChat(
            informacoes_complementares=["uso de medicamento"],
            informacoes_complementares_respondidas=False,
        )
        self.assertTrue(dados.informacoes_complementares_respondidas)
        self.assertNotIn("informações complementares", dados.campos_pendentes())

    def test_negativa_consistente_e_preservada(self):
        dados = DadosColetaChat(
            sintomas=[], sintomas_respondidos=True,
            informacoes_complementares=[],
            informacoes_complementares_respondidas=True,
        )
        self.assertEqual(dados.sintomas, [])
        self.assertEqual(dados.informacoes_complementares, [])
        self.assertNotIn("sintomas", dados.campos_pendentes())
        self.assertNotIn("informações complementares", dados.campos_pendentes())

    def test_lista_explicita_sem_indicador_mantem_compatibilidade(self):
        dados = DadosColetaChat(sintomas=[], informacoes_complementares=[])
        self.assertTrue(dados.sintomas_respondidos)
        self.assertTrue(dados.informacoes_complementares_respondidas)

    def test_nao_inventa_campos_ausentes(self):
        dados = DadosColetaChat()
        self.assertIsNone(dados.idade)
        self.assertIsNone(dados.tempo_sintomas)
        self.assertIsNone(dados.intensidade)
        self.assertIsNone(dados.sintomas)
        self.assertIsNone(dados.informacoes_complementares)
