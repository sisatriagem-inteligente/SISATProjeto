import './CardHistorico.css';

type CardHistoricoProps ={
    data: string;
    hora: string;
    sintomas: string;
    status: string;
}

export default function CardHistorico({
    data,
    hora,
    sintomas,
    status
}: CardHistoricoProps){

    
    const classeStatus ={
        "Em andamento":"em-andamento",
        "Concluído":"concluido"
    }[status];

    return(
        <div className='cardHistorico'>

            <div className='card-data'>
                <i className="bi bi-calendar"></i>
                <div className='dataHora'>
                    <p className='data'>{data}</p>
                    <span className='hora'>{hora}</span>
                </div>
            </div>

            <div className='card-sintomas'>
                <p>{sintomas}</p>
            </div>

            <div className={`status ${classeStatus}`}>
                {status}
            </div>
        </div>
    )
}