import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import MarIAMedico from "../../../assets/img/MarIA-fichamed.png";
import './FichaMedica.css';


export default function FichaMed() {

    const location = useLocation();

    const paciente = location.state?.paciente;

    // Estados do Formulário
    const [altura, setAltura] = useState('');
    const [peso, setPeso] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [fc, setFc] = useState('');
    const [fr, setFr] = useState('');
    const [temp, setTemp] = useState('');
    const [exameFisico, setExameFisico] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Formulário Médico Enviado com Sucesso!');
    };

    return (
        <div className='fm-container'>
            <Link className="btn-voltar" to="/painelAtendimento">
                <i className="bi bi-caret-left-fill"/>
            </Link>


            {/* Card do Paciente */}
            <div className='fm-patient-card'>
                <div className='patient-top'>
                    <div className='patient-avatar'></div>
                    <div className='patient-info'>
                        <h2 className='patient-name'>{paciente?.nome}</h2>
                        <div className='patient-badges'>
                            <span className='badge badge-cyan'>Idade: <strong>{paciente?.idade}</strong></span>
                            <span className='badge badge-blue'>Sexo: <strong>{paciente?.sexo}</strong></span>
                            <span className='badge badge-cyan'>Intensidade da dor: <strong>{paciente?.intensidadeDor}</strong></span>
                        </div>
                    </div>
                    <span className='badge badge-date'>Data: <strong>{paciente?.data}</strong></span>
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
                                {paciente?.sintomas}
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
                                <span>{paciente?.tempoSintomas}</span>
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
                                type="text"
                                className='input-mini'
                                value={altura}
                                onChange={(e) => setAltura(e.target.value)}
                            /> m
                        </label>

                        <label className='input-inline-label'>
                            <span className='req-star'>*</span>Peso:
                            <input
                                type="text"
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
                                type="text"
                                className='input-mini'
                                value={fc}
                                onChange={(e) => setFc(e.target.value)}
                            /> bpm
                        </label>

                        <label className='input-inline-label'>
                            <span className='req-star'>*</span>FR:
                            <input
                                type="text"
                                className='input-mini'
                                value={fr}
                                onChange={(e) => setFr(e.target.value)}
                            /> irpm
                        </label>

                        <label className='input-inline-label'>
                            <span className='req-star'>*</span>Temp:
                            <input
                                type="text"
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
                           No mínimo 2 linhas
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

                                <div className='hipotese-item'>
                                    <p><span className='blue-text bold'>1º:</span> Gripe</p>
                                    <p><span className='blue-text'>Justificativa:</span> Tosse</p>
                                </div>

                                <div className='hipotese-item'>
                                    <p><span className='blue-text bold'>2º:</span> Infarto</p>
                                    <p><span className='blue-text'>Justificativa:</span> Braço formigando</p>
                                </div>

                                <div className='hipotese-item'>
                                    <p><span className='blue-text bold'>3º:</span> Tuberculose</p>
                                    <p><span className='blue-text'>Justificativa:</span> Tosse e cansaço excessivo</p>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className='btn-enviar-ficha'>
                            Salvar Triagem
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}