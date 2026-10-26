"""Testes sem Ollama, rede ou credenciais; somente dados fictícios."""

import json
import inspect
import unittest
from unittest.mock import Mock, patch
from uuid import UUID

from app.observability import observar_etapa, observar_funcao


class TestObservacaoTecnica(unittest.TestCase):
    def test_decorador_preserva_assinatura_e_retorno_sem_copiar_argumentos(self):
        registros = []
        def original(estado: dict) -> dict:
            return estado
        observada = observar_funcao("validar_dados", registros.append)(original)
        estado = {"conteudo": "HISTORICO_FICTICIO_NAO_ENVIAR"}
        self.assertIs(observada(estado=estado), estado)
        self.assertEqual(observada.__name__, original.__name__)
        self.assertEqual(inspect.signature(observada), inspect.signature(original))
        self.assertEqual(len(registros), 1)
        self.assertNotIn("HISTORICO_FICTICIO", json.dumps(registros[0]))

    def test_decorador_preserva_erro_original_quando_destino_falha(self):
        destino = Mock(side_effect=RuntimeError("Destino indisponível"))
        erro = ValueError("Falha original fictícia")
        @observar_funcao("validar_dados", destino)
        def operacao():
            raise erro
        with self.assertRaises(ValueError) as capturada:
            operacao()
        self.assertIs(capturada.exception, erro)
        destino.assert_called_once()

    def test_registro_contem_apenas_campos_tecnicos(self):
        registros = []
        with observar_etapa("gerar_resumo", registros.append):
            resultado = {"resumo": "CONTEUDO_FICTICIO_QUE_NAO_PODE_SAIR"}

        self.assertEqual(len(registros), 1)
        registro = registros[0]
        self.assertEqual(set(registro), {
            "id", "name", "run_type", "inputs", "outputs", "start_time",
            "end_time", "extra",
        })
        self.assertEqual(str(UUID(registro["id"])), registro["id"])
        self.assertEqual(registro["name"], "sisat_gerar_resumo")
        self.assertEqual(registro["run_type"], "chain")
        self.assertEqual(registro["inputs"], {})
        self.assertEqual(registro["outputs"], {})
        self.assertEqual(set(registro["extra"]), {"metadata"})
        self.assertEqual(set(registro["extra"]["metadata"]), {
            "etapa", "status", "duracao_ms",
        })
        self.assertEqual(registro["extra"]["metadata"]["status"], "sucesso")
        self.assertNotIn(resultado["resumo"], json.dumps(registro))

    def test_falha_preserva_excecao_sem_registrar_seu_conteudo(self):
        registros = []
        erro = ValueError("HISTORICO_FICTICIO_DENTRO_DA_EXCECAO")
        with self.assertRaises(ValueError) as capturada:
            with observar_etapa("extrair_dados", registros.append):
                raise erro
        self.assertIs(capturada.exception, erro)
        self.assertEqual(registros[0]["extra"]["metadata"]["status"], "falha")
        self.assertNotIn(str(erro), json.dumps(registros[0]))
        self.assertNotIn("traceback", json.dumps(registros[0]))
        self.assertNotIn("error", registros[0])

    def test_nome_livre_e_rejeitado_sem_ser_enviado(self):
        destino = Mock()
        with self.assertRaises(ValueError) as capturada:
            with observar_etapa("NOME_FICTICIO_DO_PACIENTE", destino):
                self.fail("Uma etapa inválida não deve executar a operação")
        destino.assert_not_called()
        self.assertNotIn("NOME_FICTICIO_DO_PACIENTE", str(capturada.exception))

    def test_falha_do_destino_nao_interrompe_operacao(self):
        destino = Mock(side_effect=RuntimeError("Destino indisponível"))
        with observar_etapa("chat", destino):
            resultado = "resultado preservado"
        self.assertEqual(resultado, "resultado preservado")
        destino.assert_called_once()

    def test_falha_do_destino_nao_substitui_excecao_da_operacao(self):
        destino = Mock(side_effect=RuntimeError("Destino indisponível"))
        erro = ValueError("Falha original fictícia")
        with self.assertRaises(ValueError) as capturada:
            with observar_etapa("triagem", destino):
                raise erro
        self.assertIs(capturada.exception, erro)
        destino.assert_called_once()

    @patch("app.observability.perf_counter", side_effect=[10.0, 10.125])
    def test_duracao_usa_contador_monotonico(self, contador):
        registros = []
        with observar_etapa("validar_dados", registros.append):
            pass
        self.assertEqual(registros[0]["extra"]["metadata"]["duracao_ms"], 125.0)
        self.assertEqual(contador.call_count, 2)
