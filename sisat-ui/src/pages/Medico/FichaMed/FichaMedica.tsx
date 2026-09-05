import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MarIAMedico from "../../../assets/img/MarIA-fichamed.png";
import './FichaMedica.css';
import { obterMensagemErro, obterUsuario } from '../../../services/api';
import {
    buscarTriagemPorId,
    concluirAtendimento,
    iniciarAtendimento,
    salvarInformacoesMedicas,
    type TriagemCompleta,
} from '../../../services/triagensApi';


export default function FichaMed() {
    const { triagemId } = useParams();
    const navigate = useNavigate();
    const [triagem, setTriagem] = useState<TriagemCompleta | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [mensagem, setMensagem] = useState('');

    // Estados do Formulário
    const [altura, setAltura] = useState('');
    const [peso, setPeso] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [fc, setFc] = useState('');
    const [fr, setFr] = useState('');
    const [temp, setTemp] = useState('');
    const [exameFisico, setExameFisico] = useState('');

    useEffect(() => {
        async function carregarFicha() {
            if (!triagemId) {
                setMensagem('Triagem inválida.');
                setCarregando(false);
                return;
            }

            const usuario = obterUsuario();
            if (!usuario || usuario.role !== 'medico') {
                navigate('/loginMedico');
                return;
            }

            try {
                const resposta = await buscarTriagemPorId(triagemId);
                const dados = resposta.data.triagem;

                setTriagem(dados);
                setAltura(dados.informacoes_medicas?.altura?.toString() ?? '');
                setPeso(dados.informacoes_medicas?.peso?.toString() ?? '');
                setTemp(dados.informacoes_medicas?.temperatura?.toString() ?? '');
                setFc(dados.informacoes_medicas?.frequencia_cardiaca?.toString() ?? '');
                setFr(dados.informacoes_medicas?.frequencia_respiratoria?.toString() ?? '');
                setExameFisico(dados.informacoes_medicas?.exame_fisico_direcionado ?? '');
                setObservacoes(dados.informacoes_medicas?.observacoes ?? '');
            } catch (erro) {
                setMensagem(obterMensagemErro(erro));
            } finally {
                setCarregando(false);
            }
        }

        void carregarFicha();
    }, [navigate, triagemId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!triagemId) return;

        setSalvando(true);
        setMensagem('');
        try {
            const usuario = obterUsuario();
            if (!usuario || usuario.role !== 'medico') {
                navigate('/loginMedico');
                return;
            }
            if (!triagem?.medico_id) {
                await iniciarAtendimento(triagemId, usuario.id);
            }
            await salvarInformacoesMedicas(triagemId, {
                ...(altura && { altura: Number(altura.replace(',', '.')) }),
                ...(peso && { peso: Number(peso.replace(',', '.')) }),
                ...(temp && { temperatura: Number(temp.replace(',', '.')) }),
                ...(fc && { frequencia_cardiaca: Number(fc) }),
                ...(fr && { frequencia_respiratoria: Number(fr) }),
                ...(exameFisico && { exame_fisico_direcionado: exameFisico }),
                ...(observacoes && { observacoes }),
            });
            await concluirAtendimento(triagemId);
            navigate('/painelAtendimento');
        } catch (erro) {
            setMensagem(obterMensagemErro(erro));
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className='fm-container'>
            <Link className="btn-voltar" to="/painelAtendimento">
                <i className="bi bi-caret-left-fill"/>
            </Link>

            {carregando && <p>Carregando ficha...</p>}
            {mensagem && <p>{mensagem}</p>}


            {/* Card do Paciente */}
            <div className='fm-patient-card'>
                <div className='patient-top'>
                    <div className='patient-avatar'></div>
                    <div className='patient-info'>
                        <h2 className='patient-name'>{triagem?.dados_paciente?.nome}</h2>
                        <div className='patient-badges'>
                            <span className='badge badge-cyan'>Idade: <strong>{triagem?.dados_paciente?.idade}</strong></span>
                            <span className='badge badge-blue'>Sexo: <strong>{triagem?.dados_paciente?.sexo}</strong></span>
                            <span className='badge badge-cyan'>Intensidade da dor: <strong>{triagem?.dados_triagem?.intensidade}</strong></span>
                        </div>
                    </div>
                    <span className='badge badge-date'>Data: <strong>{triagem ? new Date(triagem.data_hora_entrada).toLocaleDateString('pt-BR') : ''}</strong></span>
                </div>

                {/* Seção Sintomas */}
                <div className='sintomas-wrapper'>
                    <div className='sintomas-box'>
                        {/* Principais Sintomas */}
                        <div className='sintomas-col'>
                            <div className='sintomas-title'>
                                <i className="bi bi-clipboard-check icon-blue"></i>
                                <h3>Principais Sintomas</h3>
                            </div>
                            <p className='sintomas-desc'>
                                {triagem?.dados_triagem?.sintomas.join(', ')}
                            </p>
                        </div>

                        <div className='sintomas-divider'></div>

                        {/* Tempo dos Sintomas */}
                        <div className='sintomas-col'>
                            <div className='sintomas-title'>
                                <i className="bi bi-clock icon-blue"></i>
                                <h3>Tempo dos sintomas</h3>
                            </div>
                            <div className='tempo-badge'>
                                <i className="bi bi-calendar3"></i>
                                <span>{triagem?.dados_triagem?.tempo_sintomas}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Formulário Médico */}
            <div className='fm-form-wrapper'>
                <div className='form-tab-header'>Formulário Médico</div>

                <form className='fm-form-card' onSubmit={handleSubmit}>
                    
                    {/* Dados Pessoais */}
                    <span className='form-sub-tag'>Dados Pessoais</span>
                    <div className='form-row margin-bottom-15'>
                        <label className='input-inline-label'>
                            <span className='req-star'>*</span>Altura:
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                className='input-mini'
                                value={altura}
                                onChange={(e) => setAltura(e.target.value)}
                            /> m
                        </label>

                        <label className='input-inline-label'>
                            <span className='req-star'>*</span>Peso:
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                required
                                className='input-mini'
                                value={peso}
                                onChange={(e) => setPeso(e.target.value)}
                            /> kg
                        </label>
                    </div>

                    <div className='form-group margin-bottom-25'>
                        <label className='label-bold'>Observações:</label>
                        <textarea
                            className='fm-textarea'
                            rows={3}
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                        />
                    </div>

                    {/* Dados Clínicos */}
                    <span className='form-sub-tag'>Dados Clínicos</span>
                    <div className='form-row margin-bottom-15'>
                        <label className='input-inline-label'>
                            <span className='req-star'>*</span>FC:
                            <input
                                type="number"
                                min="0"
                                step="1"
                                required
                                className='input-mini'
                                value={fc}
                                onChange={(e) => setFc(e.target.value)}
                            /> bpm
                        </label>

                        <label className='input-inline-label'>
                            <span className='req-star'>*</span>FR:
                            <input
                                type="number"
                                min="0"
                                step="1"
                                required
                                className='input-mini'
                                value={fr}
                                onChange={(e) => setFr(e.target.value)}
                            /> irpm
                        </label>

                        <label className='input-inline-label'>
                            <span className='req-star'>*</span>Temp:
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                required
                                className='input-mini'
                                value={temp}
                                onChange={(e) => setTemp(e.target.value)}
                            /> °C
                        </label>
                    </div>

                    <div className='form-group margin-bottom-20'>
                        <label className='label-bold'><span className='req-star'></span>Exame Físico Direcionado:</label>
                        <textarea
                            className='fm-textarea'
                            rows={3}
                            value={exameFisico}
                            onChange={(e) => setExameFisico(e.target.value)}
                        />
                    </div>

                    {/* Resumo da Conversa MarIA - Posicionado abaixo do Exame Físico */}
                    <div className='maria-summary-section'>
                        <span className='maria-summary-tag'>Resumo gerado pela MarIA</span>
                        <p className='maria-summary-text'>
                           {triagem?.resumo ?? 'Resumo não informado.'}
                        </p>
                    </div>

                    {/* Área Inferior com Avatar + Balão de Hipótese + Botão Enviar */}
                    <div className='maria-bottom-row'>
                        <div className='maria-hipotese-wrapper'>
                            <div className='maria-avatar-box'>
                                <img src={MarIAMedico} alt="MarIA" className="maria-avatar-img" />
                            </div>

                            <div className='hipotese-bubble'>
                                <h4 className='hipotese-title'>Hipótese Inicial</h4>

                                {triagem?.hipoteses_clinicas_iniciais.length ? (
                                    triagem.hipoteses_clinicas_iniciais.map((item, indice) => (
                                        <div className='hipotese-item' key={`${item.hipotese}-${indice}`}>
                                            <p><span className='blue-text bold'>{indice + 1}º:</span> {item.hipotese}</p>
                                            <p><span className='blue-text'>Justificativa:</span> {item.justificativa}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className='hipotese-item'>Nenhuma hipótese informada.</div>
                                )}
                            </div>
                        </div>

                        <button type="submit" className='btn-enviar-ficha' disabled={salvando || carregando}>
                            {salvando ? 'Salvando...' : 'Salvar Triagem'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
