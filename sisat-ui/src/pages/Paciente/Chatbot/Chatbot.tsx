import {useState} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Chatbot.css';
import MarIA from '../../../assets/img/MarIA.png';
import ModalTriagemConcluida from '../../../components/ModalTriagemConcluida/ModalTriagemConcluida';

import { obterMensagemErro } from '../../../services/api';
import { enviarMensagemMaria } from '../../../services/triagensApi';

interface Mensagem {
    id: number;
    texto: string;
    tipo: 'usuario' | 'bot';
}



export default function Chatbot() {

    const navigate = useNavigate(); //usados para o pop-up de confirmação de sair do chat

    const { triagemId } = useParams<{ triagemId: string }>();

    //pop-up de confirmação de sair do chat
    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false); //usados para o pop-up de confirmação de sair do chat

    //modal de triagem concluída
    const [mostrarTriagemConcluida, setMostrarTriagemConcluida] = useState(false); 

    //estado para impedir envios duplicados 
    const [enviando, setEnviando] = useState(false);

    //mensagem de erro da comunicação com a API
    const [erro, setErro] = useState('');

    const [mensagens, setMensagens] = useState<Mensagem[]>([
        {
            id:1,
            texto: 'Olá! Eu sou a MarIA, assistente virtual do SISAT, e vou acompanhar você durante sua triagem. Para começarmos, vou precisar de algumas informações: nome completo, idade, sexo, queixa principal, sintomas, há quanto tempo eles começaram, intensidade dos sintomas e outras informações que possam ajudar na avaliação. Vou fazer as perguntas aos poucos, de forma simples. Podemos começar?',
            tipo: 'bot'
        }
    ]);


    const [texto, setTexto] = useState('');

    async function enviarMensagem() {

        if (texto.trim() === '' || enviando || mostrarTriagemConcluida || !triagemId) {
            return;
        }
    

        const mensagemEnviada = texto.trim();

        const novaMensagemUsuario: Mensagem = {
            id: Date.now(),
            texto: mensagemEnviada,
            tipo: 'usuario'
        }

        setMensagens((mensagensAnteriores) => [
            ...mensagensAnteriores,
            novaMensagemUsuario,
        ]);

        setTexto('');

        setErro('');
        
        setEnviando(true);

        try {

            const resposta = await enviarMensagemMaria(triagemId, mensagemEnviada);

            const novaMensagemMarIA: Mensagem = {
                id: Date.now() + 1,
                texto: resposta.data.mensagem,
                tipo: 'bot'
            };

            setMensagens((mensagensAnteriores) => [
                ...mensagensAnteriores,
                novaMensagemMarIA,
            ]);

            /*
            * A finalização da triagem depende somente do campo "finalizada" retornado pela API*/

            if (resposta.data.finalizada === true) {
                localStorage.removeItem('triagem_ativa_id');
                setMostrarTriagemConcluida(true);
            }

        } catch (erroApi) {

            setMensagens((anteriores) => anteriores.filter((item) => item.id !== novaMensagemUsuario.id));
            setTexto(mensagemEnviada);
            setErro(obterMensagemErro(erroApi));

        } finally {
            setEnviando(false);
        }
    }

    function abrirConfirmacao() {
        setMostrarConfirmacao(true);
    }

    function fecharConfirmacao() {
        setMostrarConfirmacao(false);
    }

    function abandonarTriagem() {
        navigate('/inicioPaciente');
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
                        disabled={enviando || mostrarTriagemConcluida}
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
                <section className="chatbot-messages" aria-live="polite">

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

                    {enviando && (
                        <div className="chatbot-message bot">
                            <div className="message">
                                Maria está processando sua resposta...
                            </div>
                        </div>
                    )}

                </section>

                {/* MENSAGEM DE ERRO */}
                {erro && (
                    <p className="chatbot-error" role="alert">
                        {erro}
                    </p>
                )}


                {/* INPUT */}
                <form className="chatbot-input-area" onSubmit={(evento) => {
                    evento.preventDefault();
                    enviarMensagem();
                }}
                >
                    <input 
                    type="text" 
                    placeholder={enviando
                        ? "Processando..." 
                        : "Digite sua mensagem..."
                    } 
                    value={texto} 
                    onChange={(evento) => setTexto(evento.target.value)} 
                    disabled={enviando || mostrarTriagemConcluida} 
                    />
                    <button type="submit" aria-label="Enviar mensagem" disabled={enviando || mostrarTriagemConcluida}>
                        ➤
                    </button>

                </form>

            </section>


                {/* POP-UP DE CONFIRMAÇÃO DE ABANDONO DA TRIAGEM */}
                {mostrarConfirmacao && (
                    <div className="confirmacao-overlay">

                        <div className="confirmacao-modal">

                            <h2>Tem certeza que deseja abandonar a triagem?</h2>
                            <p>Todo seu histórico será perdido.</p>

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

                {/* MODAL DE TRIAGEM CONCLUIDA */}
                {mostrarTriagemConcluida && (
                    <ModalTriagemConcluida />
                )}

        </main>
    );
}
