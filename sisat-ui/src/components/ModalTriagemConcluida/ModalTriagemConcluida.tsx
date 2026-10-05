import { useNavigate } from 'react-router-dom';
import './ModalTriagemConcluida.css';

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