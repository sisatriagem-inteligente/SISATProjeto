import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { obterMensagemErro } from "../../../services/api";
import { buscarPainelMedico, type TriagemPainelMedico } from "../../../services/triagensApi";
import CardAtendimento from "../../../components/CardAtendimento/CardAtendimento";
import "./PainelAtendimento.css";

function PainelAtendimento() {

    const navigate = useNavigate();

    const [triagens, setTriagens] = useState<TriagemPainelMedico[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {

        async function carregarAtendimentos() {

            try {

                const resposta = await buscarPainelMedico();
                setTriagens(resposta.data.triagens);

            } catch (erro) {

                setErro(obterMensagemErro(erro));
            } finally {
                setCarregando(false);

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

                {carregando && <p>Carregando atendimentos...</p>}
                {erro && <p>{erro}</p>}
                {!carregando && !erro && triagens.length === 0 && (
                    <p>Nenhum paciente aguardando atendimento.</p>
                )}
                {triagens.map((triagem) => (

                    <CardAtendimento
                        key={triagem.id}
                        id={triagem.id}
                        nome={triagem.paciente.nome ?? 'Não informado'}
                        idade={triagem.paciente.idade ?? 0}
                        sexo={triagem.paciente.sexo ?? 'Não informado'}
                        data={new Date(triagem.data_hora_entrada).toLocaleDateString('pt-BR')}
                        sintomas={triagem.sintomas.join(', ') || triagem.queixa_principal || 'Não informado'}
                        prioridade={triagem.cor_classificacao ?? 'verde'}
                        onVerCompleto={() =>
                            abrirAtendimento(triagem.id)
                        }
                    />

                ))}

            </section>

        </main>
    );
}

export default PainelAtendimento;
