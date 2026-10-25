
import './CardAtendimento.css';

interface CardAtendimentoProps {
    id: string;
    nome: string;
    idade: number | null;
    sexo: string;
    data: string;
    sintomas: string;
    prioridade: "vermelho" | "amarelo" | "verde" | null;
    onVerCompleto: () => void;
}

function CardAtendimento({
    nome,
    idade,
    sexo,
    data,
    sintomas,
    prioridade,
    onVerCompleto
}: CardAtendimentoProps) {

    return (
        <div className={`card-atendimento ${prioridade ?? ''}`}>

            <div
                className={`card-prioridade ${prioridade ?? ''}`}
                aria-hidden="true"
            ></div>

            <div className="card-atendimento-conteudo">

                <div className="card-atendimento-linha-principal">

                    <h2>{nome}</h2>

                    <div className="card-atendimento-dados">

                        <span>
                            <strong>idade:</strong> {idade ?? 'Não informada'}
                        </span>

                        <span>
                            <strong>sexo:</strong> {sexo}
                        </span>

                        <span>
                            <strong>data:</strong> {data}
                        </span>

                    </div>

                </div>

                <p className="card-sintomas">
                    <strong>sintomas:</strong> {sintomas}
                </p>

            </div>

            <button
                type="button"
                className="btn-ver-completo"
                onClick={onVerCompleto}
            >
                <span>ver completo</span>
                <span className="seta">➜</span>
            </button>

        </div>
    );
}

export default CardAtendimento;
