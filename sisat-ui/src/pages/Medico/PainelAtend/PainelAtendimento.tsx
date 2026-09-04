import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { buscarAtendimentosEmAndamento } from "../../../services/api";
import CardAtendimento from "../../../components/CardAtendimento/CardAtendimento";
import "./PainelAtendimento.css";

interface Paciente {
    id: string;
    nome: string;
    idade: number;
    sexo: string;
    data: string;
    sintomas: string;
    prioridade: "vermelho" | "amarelo" | "verde";
}

function PainelAtendimento() {

    const navigate = useNavigate();

    const [pacientes, setPacientes] = useState<Paciente[]>([]);

    useEffect(() => {

        async function carregarAtendimentos() {

            try {

                const dados = await buscarAtendimentosEmAndamento();

                setPacientes(dados);

            } catch (erro) {

                console.error(
                    "Erro ao carregar atendimentos:",
                    erro
                );

            }

        }

        carregarAtendimentos();

    }, []);

    function abrirAtendimento(idAtendimento: string) {

        navigate(`/ficha-atendimento/${idAtendimento}`);

    }

    return (
        <main className="painel-atendimento-container">

            <div className="painel-atendimento-header">

                <Link
                    className="btn-voltar"
                    to="/inicioMedico"
                >
                    <i className="bi bi-caret-left-fill" />
                </Link>

                <p className="painel-atendimento-boas-vindas">
                    Bem-vindo(a) ao <strong>painel médico!</strong>
                </p>

                <h1>
                    Pacientes em andamento
                </h1>

            </div>

            <section className="lista-atendimentos">

                {pacientes.map((paciente) => (

                    <CardAtendimento
                        key={paciente.id}
                        id={paciente.id}
                        nome={paciente.nome}
                        idade={paciente.idade}
                        sexo={paciente.sexo}
                        data={paciente.data}
                        sintomas={paciente.sintomas}
                        prioridade={paciente.prioridade}
                        onVerCompleto={() =>
                            abrirAtendimento(paciente.id)
                        }
                    />

                ))}

            </section>

        </main>
    );
}

export default PainelAtendimento;