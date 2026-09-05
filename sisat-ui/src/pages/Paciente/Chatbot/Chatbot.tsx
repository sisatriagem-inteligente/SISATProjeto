import {useState} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Chatbot.css';
import MarIA from '../../../assets/img/MarIA.png';
import { obterMensagemErro } from '../../../services/api';
import { enviarMensagemMaria } from '../../../services/triagensApi';

interface Mensagem {
    id: number;
    texto: string;
    tipo: 'usuario' | 'bot';
}

export default function Chatbot() {

    const navigate = useNavigate(); //usados para o pop-up de confirmação de sair do chat
    const { triagemId } = useParams();

    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false); //usados para o pop-up de confirmação de sair do chat

    const [mensagens, setMensagens] = useState<Mensagem[]>([
        {
            id:1,
            texto: 'Olá! Eu sou a MarIA, assistente virtual do SISAT. Como posso ajudá-lo hoje?',
            tipo: 'bot'
        }
    ]);

    const [texto, setTexto] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [finalizada, setFinalizada] = useState(false);
    const [erro, setErro] = useState('');

    async function enviarMensagem() {
        const conteudo = texto.trim();
        if (conteudo === '' || carregando || finalizada || !triagemId) {
            return;
        }

        const novaMensagemUsuario: Mensagem = {
            id: Date.now(),
            texto: conteudo,
            tipo: 'usuario'
        };

        setMensagens((mensagensAnteriores) => [
            ...mensagensAnteriores,
            novaMensagemUsuario,
        ]);

        setTexto('');
        setErro('');
        setCarregando(true);

        try {
            const resposta = await enviarMensagemMaria(triagemId, conteudo);
            const novaMensagemBot: Mensagem = {
                id: Date.now() + 1,
                texto: resposta.data.mensagem,
                tipo: 'bot',
            };
            setMensagens((anteriores) => [...anteriores, novaMensagemBot]);

            if (resposta.data.finalizada) {
                setFinalizada(true);
                localStorage.removeItem('triagem_ativa_id');
            }
        } catch (falha) {
            setErro(obterMensagemErro(falha));
        } finally {
            setCarregando(false);
        }
    }

    function abrirConfirmacao() { //abre o pop-up de confirmação de sair do chat
        setMostrarConfirmacao(true);
    }

    function fecharConfirmacao() { //fecha o pop-up de confirmação de sair do chat
        setMostrarConfirmacao(false);
    }

    function abandonarTriagem() { //abandona a triagem e navega para a página inicial
        navigate('/inicioPaciente'); //navega para a página inicial
    }


    return (
        <main className='chatbot-container'>

            <section className="chatbot">

                {/* CABEÇALHO */}

                <header className="chatbot-header">
                    <button
                        className="chatbot-back"
                        onClick={abrirConfirmacao}
                        aria-label="Voltar para a tela inicial"
                    >
                        <i className="bi bi-caret-left-fill"></i>
                    </button>

                    <div className="chatbot-avatar">
                        
                         <img src={MarIA} alt="MarIA" className="chatbot-avatar-img" />{/* imagem da marIA */}
                    </div>

                    <div className="chatbot-title">
                        <h1>MarIA</h1>
                        <span> Assistente Virtual</span>
                    </div>
                </header>

                

                {/* ÁREA DAS MENSAGENS */}
                <section className="chatbot-messages">
                    {mensagens.map((mensagem) => (
                        <div
                            key={mensagem.id}
                            className={`chatbot-message ${mensagem.tipo}`}
                            >
                                <div className="message">
                                    {mensagem.texto}
                                </div>

                            </div>
                    ))}
                    {carregando && (
                        <div className="chatbot-message bot">
                            <div className="message">A MarIA está analisando...</div>
                        </div>
                    )}
                    {erro && (
                        <div className="chatbot-message bot">
                            <div className="message">{erro}</div>
                        </div>
                    )}
                </section>


                {/* INPUT */}
                <form className="chatbot-input-area" onSubmit={(evento) => {
                    evento.preventDefault();
                    enviarMensagem();
                }}
                >
                    <input type="text" placeholder={finalizada ? 'Triagem finalizada' : 'Digite aqui...'} value={texto} onChange={(evento) => setTexto(evento.target.value)} disabled={carregando || finalizada} />
                    <button type="submit" aria-label="Enviar mensagem" disabled={carregando || finalizada}>
                        ➤
                    </button>

                </form>

            </section>
                {/* POP-UP DE CONFIRMAÇÃO */}
                {mostrarConfirmacao && (
                    <div className="confirmacao-overlay">

                        <div className="confirmacao-modal">

                            <h2>Tem certeza que deseja abandonar a triagem?</h2>
                            <p>Você poderá continuar esta triagem depois.</p>

                            <div className="confirmacao-botoes">
                                <button
                                    className="btn-sim"
                                    onClick={abandonarTriagem}
                                >
                                    Sim
                                </button>
                                
                                
                                <button
                                    className="btn-ficar"
                                    onClick={fecharConfirmacao}
                                >
                                    Ficar 
                                </button>

                                

                            </div>

                        </div>

                    </div>
                )}

        </main>
    );
}
