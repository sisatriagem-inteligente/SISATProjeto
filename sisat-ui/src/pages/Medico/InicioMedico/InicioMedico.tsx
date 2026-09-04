import './InicioMedico.css';
import bemVindoMedico from "../../../assets/img/bemvindo-medico.png";
import { Link } from 'react-router-dom';


export default function InicioMedico() {
    return (
        <div className='ip-container'>
            <div className='ip-content'>
                {/* Esquerda */}
                <div className='ip-left'>
                    <img
                        src={bemVindoMedico}
                        className='img-bemVindo'
                        alt='Bem vindo, profissional.'
                    />
                    <p className='ip-subtitle'>
                        Acesse rapidamente as triagens realizadas pelos pacientes, acompanhe os resultados e consulte as informações necessárias em um só lugar.
                    </p>
                </div>
               
                {/* Direita */}
                <div className='ip-right'>
                    <div className='ip-btn-block'>
                        <Link to='/painelAtendimento' className='btn-painelAtendimento'>
                            <span className='icone'>
                                <i className="bi bi-clipboard-data" />
                            </span>
                            <span className='btn-text'>
                                Painel de<br />atendimentos
                            </span>
                        </Link>
                    </div>
                </div>
            </div>


           
        </div>
    );
}
