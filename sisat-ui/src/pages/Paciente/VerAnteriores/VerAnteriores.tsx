import './VerAnteriores.css';
import CardHistorico from '../../../components/CardHistorico/CardHistorico';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { obterMensagemErro, obterUsuario } from '../../../services/api';
import { buscarTriagensDoPaciente, type ItemHistoricoTriagem } from '../../../services/triagensApi';

export default function VerAnteriores(){
    const usuarioId = obterUsuario()?.id ?? null;
    const [triagens, setTriagens] = useState<ItemHistoricoTriagem[]>([]);
    const [carregando, setCarregando] = useState(Boolean(usuarioId));
    const [erro, setErro] = useState(usuarioId ? '' : 'Faça login para consultar suas triagens.');


        /*
     * INTEGRAÇÃO CODEX — HISTÓRICO DO PACIENTE
     *
     * Esta tela consulta o histórico real por meio de
     * buscarTriagensDoPaciente().
     *
     * MODO DE DEMONSTRAÇÃO:
     * - Conferir VITE_SISAT_FRONTEND_DEMO.
     * - Quando a demonstração estiver ativa, não realizar
     *   consultas ao BFF por este fluxo.
     * - Ajustar o estado de carregamento junto com o useEffect,
     *   para que a tela não fique carregando indefinidamente.
     * - Utilizar dados simulados somente se fizerem parte
     *   da demonstração planejada; não apresentá-los como reais.
     *
     * INTEGRAÇÃO REAL:
     * - Confirmar a rota e o formato da resposta no BFF atualizado.
     * - Conferir os campos utilizados pelos cartões de histórico.
     * - Preservar o tratamento de carregamento, erros e lista vazia.
     *
     * STATUS DA TRIAGEM:
     * - Confirmar no BFF o significado de Aguardando e Concluida.
     * - Não confundir o fim da coleta da MarIA com a conclusão
     *   do atendimento médico.
     * - Revisar o texto exibido nos cartões de acordo com
     *   os estados reais definidos pelo backend.
     */
    useEffect(() => {
        if (!usuarioId) return;
        buscarTriagensDoPaciente(usuarioId)
            .then((resposta) => setTriagens(resposta.data.triagens))
            .catch((falha) => setErro(obterMensagemErro(falha)))
            .finally(() => setCarregando(false));
    }, [usuarioId]);
    return(
        <>
            <main className='verAnt-container'>
                <div className='verAnt-header'>  
                    <div className='header-left'>
                        
                                    <Link to='/inicioPaciente' className='btn-voltar'>
                                        <i className="bi bi-caret-left-fill"></i>
                                        <span className='voltar-header'> Voltar ao início</span>
                                    </Link>
                                
                            <p>Bem vindo(a) ao <span className='historico'>histórico</span>!</p>
                            <h1>Triagens Anteriores</h1>
                        </div> 
                </div>
                <section className='lista-triagens'>
                    <div className='verAnt-card'>
                        <p>Data da triagem</p>
                        <p>Sintomas</p>
                        <p>Status</p>
                    </div>
                    {carregando && <p>Carregando triagens...</p>}
                    {erro && <p role='alert'>{erro}</p>}
                    {!carregando && !erro && triagens.length === 0 && (
                        <p>Nenhuma triagem anterior encontrada.</p>
                    )}
                    {triagens.map((triagem) => {
                        const data = new Date(triagem.data_hora_entrada);
                        return (
                            <CardHistorico
                                key={triagem.id}
                                data={data.toLocaleDateString('pt-BR')}
                                hora={data.toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                                sintomas={triagem.queixa_principal ?? 'Não informado'}
                                status={triagem.status === 'Concluida' ? 'Concluído' : 'Em andamento'}
                            />
                        );
                    })}


                </section>

                
            </main>
        
        </>
    )
}
