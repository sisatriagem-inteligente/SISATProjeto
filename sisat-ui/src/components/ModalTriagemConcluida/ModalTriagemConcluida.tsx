import { useNavigate } from 'react-router-dom';
import './ModalTriagemConcluida.css';


/*
 * INTEGRAÇÃO CODEX — FINALIZAÇÃO DA COLETA DA MARIA
 *
 * Este modal é exibido quando a coleta de informações
 * pela MarIA termina.
 *
 * IMPORTANTE:
 * - O fim da coleta não significa que o atendimento médico
 *   foi concluído.
 * - A triagem pode continuar aguardando atendimento profissional.
 * - Não liberar uma nova triagem apenas porque este modal
 *   foi exibido ou porque o paciente voltou à tela inicial.
 *
 * NAVEGAÇÃO:
 * - irParaHistorico() e irParaInicio() apenas mudam de rota.
 * - Esses métodos não cancelam, excluem nem finalizam
 *   registros no backend.
 * - Não implementar operações de cancelamento neste componente
 *   sem confirmar que existe um contrato correspondente no BFF.
 *
 * Durante a integração, conferir se InicioPaciente.tsx e o
 * fluxo de criação de triagem respeitam a existência de uma
 * triagem pendente, inclusive quando o ID local não existe.
 *
 * PRESERVAR o modal e seus caminhos de navegação, ajustando
 * o comportamento somente quando necessário para manter
 * a regra de negócio definida pelo backend.
 */
function ModalTriagemConcluida() {
  const navigate = useNavigate();

  const irParaHistorico = () => {
    navigate('/verAnteriores');
  };

  const irParaInicio = () => {
    navigate('/inicioPaciente');
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-triagem-concluida"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-triagem-concluida"
      >
        <div
          className="icone-confirmacao"
          aria-hidden="true"
        >
          ✓
        </div>

        <h2 id="titulo-triagem-concluida">
          Triagem concluída!
        </h2>

        <p>
          A coleta de informações pela MarIA foi concluída
          com sucesso.
        </p>

        <p className="modal-observacao">
          Sua triagem agora aguarda atendimento de um
          profissional de saúde.
        </p>

        <div className="modal-triagem-botoes">
          <button
            type="button"
            className="btn-historico"
            onClick={irParaHistorico}
          >
            Ver triagens anteriores
          </button>

          <button
            type="button"
            className="btn-inicio"
            onClick={irParaInicio}
          >
            Voltar para o início
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalTriagemConcluida;