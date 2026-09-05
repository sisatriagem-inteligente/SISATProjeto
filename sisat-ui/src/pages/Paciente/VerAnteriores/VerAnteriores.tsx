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
    const [erro, setErro] = useState(
        usuarioId ? '' : 'Faça login para consultar suas triagens.',
    );

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
                    {erro && <p>{erro}</p>}
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
