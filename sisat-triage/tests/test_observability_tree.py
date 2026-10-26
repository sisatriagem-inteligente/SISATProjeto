"""Associação de etapas sem rede, conteúdo clínico ou execução do modelo."""

from contextvars import copy_context
from copy import deepcopy
import unittest
from unittest.mock import patch

from app.langsmith_transport import enviar_registro
from app.observability import observar_etapa


class TestArvoreDeObservacao(unittest.TestCase):
    def criar_arvore(self):
        registros = []
        with observar_etapa("triagem", registros.append, agrupar=True):
            with observar_etapa("validar_dados", registros.append):
                pass
        return registros  # A etapa filha termina antes da raiz.

    def test_raiz_e_filha_compartilham_execucao_e_parentesco(self):
        filha, raiz = self.criar_arvore()
        self.assertEqual(raiz["trace_id"], raiz["id"])
        self.assertNotIn("parent_run_id", raiz)
        self.assertEqual(filha["trace_id"], raiz["id"])
        self.assertEqual(filha["parent_run_id"], raiz["id"])
        self.assertTrue(filha["dotted_order"].startswith(raiz["dotted_order"] + "."))
        self.assertTrue(filha["dotted_order"].endswith(filha["id"]))
        self.assertEqual(filha["inputs"], {})
        self.assertEqual(filha["outputs"], {})

    def test_contexto_e_restaurado_apos_falha(self):
        registros = []
        with self.assertRaises(ValueError):
            with observar_etapa("triagem", registros.append, agrupar=True):
                with observar_etapa("validar_dados", registros.append):
                    raise ValueError("Falha fictícia")
        with observar_etapa("teste_conexao", registros.append):
            pass
        self.assertNotIn("trace_id", registros[-1])
        self.assertNotIn("parent_run_id", registros[-1])
        self.assertEqual(registros[0]["extra"]["metadata"]["status"], "falha")
        self.assertEqual(registros[1]["extra"]["metadata"]["status"], "falha")

    def test_contextos_concorrentes_nao_misturam_os_ids(self):
        # Intercala duas árvores em contextos independentes no mesmo thread.
        contextos = [copy_context(), copy_context()]
        registros = [[], []]
        raizes = [observar_etapa("triagem", r.append, agrupar=True) for r in registros]
        try:
            for contexto, raiz in zip(contextos, raizes):
                contexto.run(raiz.__enter__)
            for contexto, destino in zip(contextos, registros):
                def etapa():
                    with observar_etapa("validar_dados", destino.append):
                        pass
                contexto.run(etapa)
        finally:
            for contexto, raiz in zip(contextos, raizes):
                contexto.run(raiz.__exit__, None, None, None)
        self.assertNotEqual(registros[0][-1]["id"], registros[1][-1]["id"])
        for filha, raiz in registros:
            self.assertEqual(filha["trace_id"], raiz["id"])
            self.assertEqual(filha["parent_run_id"], raiz["id"])

    @patch("app.langsmith_transport.requests.post")
    def test_transporte_aceita_arvore_valida(self, post):
        post.return_value.status_code = 202
        for registro in self.criar_arvore():
            enviar_registro(
                registro, chave_api="CHAVE_FICTICIA",
                projeto_id="11111111-1111-4111-8111-111111111111", habilitado=True,
            )
        self.assertEqual(post.call_count, 2)

    @patch("app.langsmith_transport.requests.post")
    def test_hierarquia_nao_aceita_texto_livre_ou_parentesco_inconsistente(self, post):
        filha, _ = self.criar_arvore()
        casos = []
        for campo in ("trace_id", "parent_run_id", "dotted_order"):
            registro = deepcopy(filha)
            registro[campo] = "CONTEUDO_FICTICIO_NAO_ENVIAR"
            casos.append(registro)
        registro = deepcopy(filha)
        registro["parent_run_id"] = registro["id"]
        casos.append(registro)
        registro = deepcopy(filha)
        del registro["trace_id"]
        casos.append(registro)
        for registro in casos:
            with self.subTest(registro=registro):
                with self.assertRaises(ValueError) as erro:
                    enviar_registro(
                        registro, chave_api="CHAVE_FICTICIA",
                        projeto_id="11111111-1111-4111-8111-111111111111", habilitado=True,
                    )
                self.assertNotIn("CONTEUDO_FICTICIO", str(erro.exception))
        post.assert_not_called()
