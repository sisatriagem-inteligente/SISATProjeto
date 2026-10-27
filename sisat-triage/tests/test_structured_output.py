import unittest
from unittest.mock import patch

from langchain_core.messages import HumanMessage

from app.cognitive_layer.schemas import ResultadoClinico
from app.cognitive_layer.structured_output import gerar_resultado_clinico


class TestStructuredOutput(unittest.TestCase):
    @patch("app.cognitive_layer.structured_output.structured_clinical_llm")
    def test_gera_resultado_clinico_sem_reextrair_dados_pessoais(self, modelo):
        mensagens = [HumanMessage(content="Caso fictício: dor abdominal relatada.")]
        esperado = ResultadoClinico(
            resumo_triagem={"resumo": "Dor abdominal relatada."},
            hipoteses_clinicas_iniciais=[],
        )
        modelo.invoke.return_value = esperado
        self.assertIs(gerar_resultado_clinico(mensagens), esperado)
        modelo.invoke.assert_called_once_with(mensagens)
