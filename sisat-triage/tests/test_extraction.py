import unittest
from unittest.mock import Mock

from langchain_core.exceptions import OutputParserException
from langchain_core.messages import AIMessage, HumanMessage

from app.cognitive_layer.extraction import _relatado, conferir_historico, extrair_dados
from app.cognitive_layer.schemas import DadosColetaChat
from tests.fixtures_coleta import CASOS


class TestExtracaoConservadora(unittest.TestCase):
    def test_parenteses_de_formatacao_preservam_relato(self):
        for relato in ("Uso loratadina ocasionalmente.", "Uso loratadina (ocasionalmente)."):
            with self.subTest(relato=relato):
                self.assertTrue(_relatado("loratadina (ocasionalmente)", [relato]))

    def test_parenteses_nao_autorizam_acrescimos_ou_negacoes(self):
        casos = [
            ("loratadina (10 mg) ocasionalmente", "Uso loratadina ocasionalmente."),
            ("loratadina (20 mg)", "Uso loratadina 10 mg."),
            ("loratadina (ocasionalmente)", "Não uso loratadina ocasionalmente."),
            ("loratadina (ocasionalmente)", "Uso loratadina. Ocasionalmente tenho rinite."),
            ("()", "Uso loratadina."),
        ]
        for candidato, relato in casos:
            with self.subTest(candidato=candidato, relato=relato):
                self.assertFalse(_relatado(candidato, [relato]))

    def test_seis_regressoes_com_saidas_incompletas_observadas(self):
        for nome, historico, esperado in CASOS:
            with self.subTest(caso=nome):
                # Inclui deliberadamente a duração/complementos incorretos
                # observados na auditoria. Nenhum valor do mock é evidência.
                extraido = DadosColetaChat(
                    nome="Ana" if nome in {"ana", "correcao"} else "Beatriz" if nome == "beatriz" else None,
                    idade=35 if nome in {"ana", "correcao"} else None,
                    sexo="feminino" if nome in {"ana", "correcao"} else None,
                    queixa_principal="Dor de cabeça" if nome in {"ana", "correcao"} else None,
                    sintomas=["dor de cabeça"] if nome == "beatriz" else None,
                    tempo_sintomas=">=3 horas" if nome == "correcao" else "dor de cabeça",
                    intensidade="moderada",
                    informacoes_complementares=[],
                    informacoes_complementares_respondidas=True,
                )
                resultado = conferir_historico(extraido, historico)
                for campo, valor in esperado.items():
                    self.assertEqual(getattr(resultado, campo), valor, campo)

    def test_nao_usa_opcoes_da_pergunta_como_resposta(self):
        historico = [AIMessage(content="Qual a intensidade: leve, moderada ou intensa?"),
                     HumanMessage(content="Não sei.")]
        dados = conferir_historico(DadosColetaChat(intensidade="moderada"), historico)
        self.assertIsNone(dados.intensidade)

    def test_resposta_curta_nao_usa_pergunta_antiga(self):
        historico = [AIMessage(content="Qual a intensidade?"), HumanMessage(content="Leve."),
                     AIMessage(content="Qual seu nome?"), HumanMessage(content="Moderada.")]
        self.assertEqual(conferir_historico(DadosColetaChat(), historico).intensidade, "leve")

    def test_relato_de_terceiro_nao_preenche_paciente(self):
        dados = conferir_historico(DadosColetaChat(idade=35, intensidade="intensa"), [
            HumanMessage(content="Minha irmã tem dor há 2 horas, intensidade intensa.")])
        self.assertIsNone(dados.idade)
        self.assertIsNone(dados.tempo_sintomas)
        self.assertIsNone(dados.intensidade)

    def test_duas_duracoes_na_mesma_resposta_sao_ambiguas(self):
        dados = conferir_historico(DadosColetaChat(), [
            AIMessage(content="Há quanto tempo está com os sintomas?"),
            HumanMessage(content="Dor há 2 horas e febre há 3 dias.")])
        self.assertIsNone(dados.tempo_sintomas)

    def test_negacao_nao_e_intensidade_afirmada(self):
        dados = conferir_historico(DadosColetaChat(intensidade="intensa"), [
            HumanMessage(content="A dor não é intensa.")])
        self.assertIsNone(dados.intensidade)

    def test_nao_generico_apos_pergunta_multipla_nao_confirma_listas(self):
        dados = conferir_historico(DadosColetaChat(), [
            AIMessage(content="Quais sintomas e informações complementares possui?"),
            HumanMessage(content="Não.")])
        self.assertIsNone(dados.sintomas)
        self.assertIsNone(dados.informacoes_complementares)

    def test_numero_de_duracao_nao_vira_idade(self):
        dados = conferir_historico(DadosColetaChat(idade=35), [
            AIMessage(content="Há quanto tempo?"), HumanMessage(content="35 horas.")])
        self.assertIsNone(dados.idade)
        self.assertEqual(dados.tempo_sintomas, "35 horas")

    def test_nao_tem_retry_para_campos_pendentes(self):
        extrator = Mock()
        extrator.invoke.return_value = DadosColetaChat()
        resultado = extrair_dados([HumanMessage(content="Olá.")], extrator)
        self.assertTrue(resultado.campos_pendentes())
        self.assertEqual(extrator.invoke.call_count, 1)

    def test_retry_de_parsing_nao_expoe_conteudo_na_excecao(self):
        extrator = Mock()
        extrator.invoke.side_effect = OutputParserException("SEGREDO_FICTICIO")
        with self.assertRaises(OutputParserException) as capturada:
            extrair_dados([HumanMessage(content="Olá.")], extrator)
        self.assertNotIn("SEGREDO_FICTICIO", str(capturada.exception))
        self.assertEqual(extrator.invoke.call_count, 2)

    def test_historico_vazio_nao_chama_modelo(self):
        extrator = Mock()
        self.assertIsNone(extrair_dados([], extrator).idade)
        extrator.invoke.assert_not_called()

    def test_negacao_posterior_remove_duracao_e_intensidade_antigas(self):
        dados = conferir_historico(DadosColetaChat(), [
            HumanMessage(content="Tenho dor há 2 horas, intensidade intensa."),
            HumanMessage(content="A dor não é intensa."),
            HumanMessage(content="Não estou com dor há 2 horas."),
        ])
        self.assertIsNone(dados.tempo_sintomas)
        self.assertIsNone(dados.intensidade)

    def test_pergunta_sozinha_nao_comprova_dados(self):
        dados = conferir_historico(DadosColetaChat(
            nome="Ana", idade=35, sexo="feminino", tempo_sintomas="2 horas",
            intensidade="moderada", sintomas=["dor de cabeça"],
        ), [AIMessage(content="Ana, 35 anos, feminino, dor de cabeça há 2 horas, moderada?")])
        for campo in ("nome", "idade", "sexo", "tempo_sintomas", "intensidade", "sintomas"):
            self.assertIsNone(getattr(dados, campo), campo)

    def test_intensidade_com_alternativas_nao_escolhe_por_conta_propria(self):
        dados = conferir_historico(DadosColetaChat(), [
            HumanMessage(content="Intensidade leve ou moderada.")])
        self.assertIsNone(dados.intensidade)

    def test_duracao_composta_nao_e_truncada(self):
        dados = conferir_historico(DadosColetaChat(), [
            HumanMessage(content="Estou com dor há 2 horas e meia.")])
        self.assertIsNone(dados.tempo_sintomas)

    def test_item_vazio_nao_comprova_sintoma(self):
        dados = conferir_historico(DadosColetaChat(sintomas=[""]), [HumanMessage(content="Olá.")])
        self.assertIsNone(dados.sintomas)
