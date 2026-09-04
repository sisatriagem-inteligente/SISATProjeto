import './CardAtendimento.css';

interface CardAtendimentoProps {
    id: string;
    nome: string;
    idade: number;
    sexo: string;
    data: string;
    sintomas: string;
    prioridade: "vermelho" | "amarelo" | "verde";
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
        <div className="card-atendimento">

            <div
                className={`card-prioridade ${prioridade}`}
            ></div>

            <div className="card-atendimento-conteudo">

                <div className="card-atendimento-linha-principal">

                    <h2>{nome}</h2>

                    <div className="card-atendimento-dados">

                        <span>
                            <strong>idade:</strong> {idade}
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