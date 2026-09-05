import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ResultadoMariaDto } from './dto/resultado-maria.dto';

import { CorClassificacao } from './enums/cor-classificacao.enum';

import { IntensidadeTriagem } from './enums/intensidade-triagem.enum';

import { CriarTriagemDto } from './dto/criar-triagem.dto';
import {
  Triagem,
  TriagemDocument,
  MensagemChat,
  TriagemStatus
} from './schemas/triagem.schema';

import {
  Doctor,
  DoctorDocument,
} from '../auth/schemas/doctor.schema';

import {
  Patient,
  PatientDocument,
} from '../auth/schemas/patient.schema';

import { IniciarAtendimentoDto } from './dto/iniciar-atendimento.dto';

import { InformacoesMedicasDto } from './dto/informacoes-medicas.dto';

/**
 * Tipo utilizado após o populate do paciente.
 *
 * Quando o campo paciente_id é populado pelo Mongoose,
 * ele deixa de representar apenas um ObjectId e passa
 * a possuir os dados selecionados do paciente.
 */

type PacienteAposPopulate = {
  _id: Types.ObjectId;
  cpf: string;
  email: string;
};

/**
 * Service responsável pelas regras de negócio
 * relacionadas às triagens do SISAT.
 *
 * Esta classe realiza operações como:
 * - criação de uma triagem;
 * - recebimento do resultado da MarIA;
 * - classificação da prioridade;
 * - consulta do histórico do paciente;
 * - organização do painel médico;
 * - início de atendimentos;
 * - registro de informações médicas;
 * - conclusão do atendimento.
 *
 * O service acessa diretamente o MongoDB
 * por meio dos models do Mongoose.
 */

@Injectable()
export class TriagensService {
  /**
   * Salva um turno e, quando presente, a ficha final atomicamente.
   * A versão evita sobrescrever uma conversa modificada durante a chamada à IA.
   */
  async salvarConversaMaria(
    id: string,
    versao: number,
    mensagens: MensagemChat[],
    resultado?: ResultadoMariaDto,
  ) {
    const campos: Record<string, unknown> = {};
    if (resultado) {
      campos.dados_paciente = resultado.dados_paciente;
      campos.dados_triagem = resultado.dados_triagem;
      campos.resumo_triagem = resultado.resumo_triagem;
      campos.hipoteses_clinicas_iniciais = resultado.hipoteses_clinicas_iniciais;
      campos.cor_classificacao = this.calcularCorClassificacao(resultado.dados_triagem.intensidade);
      campos.chat_finalizado = true;
    }
    const atualizada = await this.triagemModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        __v: versao,
        status: TriagemStatus.AGUARDANDO,
        medico_id: null,
        chat_finalizado: { $ne: true },
        cor_classificacao: null,
      },
      { $set: campos, $push: { mensagens: { $each: mensagens } }, $inc: { __v: 1 } },
      { returnDocument: 'after', runValidators: true },
    ).exec();
    if (!atualizada) {
      throw new ConflictException('A triagem mudou durante o processamento. Recarregue a conversa.');
    }
    return atualizada;
  }
   /**
   * Injeta os models utilizados pelo service.
   *
   * triagemModel:
   * permite criar, consultar e atualizar
   * documentos da coleção "triagens".
   *
   * doctorModel:
   * permite consultar a coleção "medicos",
   * principalmente para validar o médico
   * que assume um atendimento.
   */
  constructor(
    @InjectModel(Triagem.name)
    private readonly triagemModel: Model<TriagemDocument>,
    @InjectModel(Doctor.name)   //
    private readonly doctorModel:Model<DoctorDocument>,
    @InjectModel(Patient.name)
    private readonly patientModel: Model<PatientDocument>,
  ) {}

   /**
   * Cria uma nova triagem para um paciente.
   *
   * Neste momento, apenas o paciente_id é informado.
   * Os dados clínicos serão preenchidos posteriormente
   * após o processamento realizado pela MarIA.
   *
   * Utilizado pela rota:
   * POST /triagens
   */

  async criarTriagem(
    criarTriagemDto: CriarTriagemDto,
  ): Promise<TriagemDocument> {
    const { paciente_id } = criarTriagemDto;

    const pacienteObjectId =
      new Types.ObjectId(paciente_id);

    const pacienteExiste = await this.patientModel
      .exists({ _id: pacienteObjectId });

    if (!pacienteExiste) {
      throw new NotFoundException(
        'Paciente não encontrado.',
      );
    }

    const triagemEmAberto = await this.triagemModel
      .findOne({
        paciente_id: pacienteObjectId,
        status: TriagemStatus.AGUARDANDO,
      })
      .exec();

    if (triagemEmAberto) {
      throw new ConflictException(
        'O paciente já possui uma triagem em aberto.',
      );
    }

     /**
     * Converte o ID recebido como string
     * para um ObjectId do MongoDB antes de salvar.
     */

    const triagem = await this.triagemModel.create({
      paciente_id: pacienteObjectId,
    });

    return triagem;
  }
    /**
   * Salva na triagem o resultado produzido pela MarIA.
   *
   * O método:
   * 1. valida o ID da triagem;
   * 2. calcula a cor de classificação;
   * 3. reúne os dados recebidos da MarIA;
   * 4. atualiza a triagem no MongoDB;
   * 5. retorna a triagem já atualizada.
   *
   * Utilizado pela rota:
   * PATCH /triagens/:id/resultado-maria
   */
  async salvarResultadoMaria(
  triagem_id: string,
  resultadoMariaDto: ResultadoMariaDto,
): Promise<TriagemDocument> {

  /**
     * Verifica se o identificador possui
     * um formato válido de ObjectId.
     */
  if (!Types.ObjectId.isValid(triagem_id)) {
    throw new BadRequestException(
      'O ID da triagem informado é inválido.',
    );
  }
    /**
     * Define a prioridade da triagem
     * com base na intensidade recebida.
     */
  const cor_classificacao =
    this.calcularCorClassificacao(
      resultadoMariaDto.dados_triagem.intensidade,
    );
     /**
     * Agrupa os campos que serão atualizados
     * no documento da triagem.
     */
  const dadosAtualizacao: Record<string, unknown> = {
    dados_paciente:
      resultadoMariaDto.dados_paciente,

    dados_triagem:
      resultadoMariaDto.dados_triagem,

    resumo_triagem:
      resultadoMariaDto.resumo_triagem,

    hipoteses_clinicas_iniciais:
      resultadoMariaDto.hipoteses_clinicas_iniciais,

    cor_classificacao,
  };

   /**
     * O histórico da conversa é opcional.
     *
     * Caso seja informado, o valor é convertido
     * para ObjectId. Se chegar como null,
     * permanece null no banco.
     */

  if (
    resultadoMariaDto.historico_chat_id !== undefined
  ) {
    dadosAtualizacao.historico_chat_id =
      resultadoMariaDto.historico_chat_id
        ? new Types.ObjectId(
            resultadoMariaDto.historico_chat_id,
          )
        : null;
  }

   /**
     * Atualiza apenas os campos presentes
     * em dadosAtualizacao.
     *
     * O $set evita substituir o documento inteiro.
     */

  const triagemAtualizada =
    await this.triagemModel.findByIdAndUpdate(
      triagem_id,
      {
        $set: dadosAtualizacao,
      },
      {
        new: true,
        runValidators: true,
      },
    );

  if (!triagemAtualizada) {
    throw new NotFoundException(
      'Triagem não encontrada.',
    );
  }

  return triagemAtualizada;
}

  


 /**
   * Busca o histórico de triagens
   * pertencentes a um paciente.
   *
   * Apenas triagens que já possuem
   * queixa principal são exibidas,
   * evitando mostrar triagens ainda vazias.
   *
   * Os resultados são ordenados da triagem
   * mais recente para a mais antiga.
   *
   * Utilizado pela rota:
   * GET /triagens/paciente/:paciente_id
   */


  async buscarTriagensDoPaciente(
  paciente_id: string,
) {
  if (!Types.ObjectId.isValid(paciente_id)) {
    throw new BadRequestException(
      'O paciente_id informado é inválido.',
    );
  }

  const triagens = await this.triagemModel
    .find({
      paciente_id: new Types.ObjectId(paciente_id),

        /**
           * Impede que uma triagem criada,
           * mas ainda não preenchida pela MarIA,
           * apareça no histórico.
           */
      'dados_triagem.queixa_principal': {
        $ne: null,
      },
    })

    /**
         * Seleciona apenas os campos necessários
         * para montar a resposta do histórico.
         */
    .select({
      status: 1,
      data_hora_entrada: 1,
      dados_paciente: 1,
      dados_triagem: 1,
      resumo_triagem: 1,
      cor_classificacao: 1,
      createdAt: 1,
    })

     /**
         * Ordena da entrada mais recente
         * para a mais antiga.
         */
    .sort({
      data_hora_entrada: -1,
    })

      /**
         * Faz o Mongoose retornar objetos simples
         * em vez de documentos completos.
         */
    .lean()
    .exec();

      /**
     * Procura uma triagem que possua o nome
     * do paciente para utilizá-lo no cabeçalho
     * da resposta.
     */

  const triagemComNome = triagens.find(
    (triagem) => triagem.dados_paciente?.nome,
  );

  return {
    paciente: {
      id: paciente_id,
      nome:
        triagemComNome?.dados_paciente?.nome ??
        null,
    },

    total_triagens: triagens.length,

      /**
       * Transforma os documentos encontrados
       * em uma resposta resumida adequada
       * para o frontend.
       */

    triagens: triagens.map((triagem) => ({
      id: String(triagem._id),

      data_hora_entrada:
        triagem.data_hora_entrada,

      status: triagem.status,

      cor_classificacao:
        triagem.cor_classificacao ?? null,

      queixa_principal:
        triagem.dados_triagem
          ?.queixa_principal ?? null,

      intensidade:
        triagem.dados_triagem
          ?.intensidade ?? null,

      resumo:
        triagem.resumo_triagem?.resumo ??
        null,
    })),
  };
}


  /**
   * Calcula a cor de classificação da triagem
   * com base na intensidade informada pela MarIA.
   *
   * Regras:
   * - leve      -> verde
   * - moderada  -> amarelo
   * - intensa   -> vermelho
   */

private calcularCorClassificacao(
  intensidade: IntensidadeTriagem,
): CorClassificacao {
  switch (intensidade) {
    case IntensidadeTriagem.LEVE:
      return CorClassificacao.VERDE;

    case IntensidadeTriagem.MODERADA:
      return CorClassificacao.AMARELO;

    case IntensidadeTriagem.INTENSA:
      return CorClassificacao.VERMELHO;
  }
}

/**
 * Busca todos os dados de uma triagem específica.
 *
 * O método:
 * 1. valida o ID informado;
 * 2. busca a triagem no MongoDB;
 * 3. lança erro caso ela não exista;
 * 4. monta uma resposta completa para o frontend.
 *
 * Utilizado pela rota:
 * GET /triagens/:id
 */

async buscarTriagemPorId(triagem_id: string) {
  if (!Types.ObjectId.isValid(triagem_id)) {
    throw new BadRequestException(
      'O ID da triagem informado é inválido.',
    );
  }

    /**
   * Busca a triagem pelo identificador.
   *
   * O lean() faz com que o Mongoose retorne
   * um objeto simples, já que neste método
   * não precisamos alterar ou salvar o documento.
   */

  const triagem = await this.triagemModel
    .findById(triagem_id)
    .lean()
    .exec();

  if (!triagem) {
    throw new NotFoundException(
      'Triagem não encontrada.',
    );
  }
    /**
   * Organiza os dados no formato utilizado
   * pelo frontend.
   */

  return {
    triagem: {
      id: String(triagem._id),

      paciente_id: String(
        triagem.paciente_id,
      ),

       medico_id:
      triagem.medico_id
        ? String(triagem.medico_id)
        : null,

    atendimento_iniciado_em:
      triagem.atendimento_iniciado_em ??
      null,
    atendimento_concluido_em:
      triagem.atendimento_concluido_em ??
      null,

      historico_chat_id:
        triagem.historico_chat_id
          ? String(triagem.historico_chat_id)
          : null,

      mensagens: triagem.mensagens ?? [],
      chat_finalizado: triagem.chat_finalizado ?? Boolean(triagem.cor_classificacao),

      data_hora_entrada:
        triagem.data_hora_entrada,

      status: triagem.status,

      cor_classificacao:
        triagem.cor_classificacao ?? null,

      dados_paciente: {
        nome:
          triagem.dados_paciente?.nome ??
          null,

        idade:
          triagem.dados_paciente?.idade ??
          null,

        sexo:
          triagem.dados_paciente?.sexo ??
          null,
      },

      dados_triagem: {
        queixa_principal:
          triagem.dados_triagem
            ?.queixa_principal ?? null,

        sintomas:
          triagem.dados_triagem?.sintomas ??
          [],

        tempo_sintomas:
          triagem.dados_triagem
            ?.tempo_sintomas ?? null,

        intensidade:
          triagem.dados_triagem
            ?.intensidade ?? null,

        informacoes_complementares:
          triagem.dados_triagem
            ?.informacoes_complementares ??
          [],
      },

      resumo:
        triagem.resumo_triagem?.resumo ??
        null,

      hipoteses_clinicas_iniciais:
        triagem.hipoteses_clinicas_iniciais ??
        [],

      informacoes_medicas:
        triagem.informacoes_medicas ?? {
          altura: null,
          peso: null,
          temperatura: null,
          frequencia_cardiaca: null,
          frequencia_respiratoria: null,
          exame_fisico_direcionado: null,
          observacoes: null,
        },

      createdAt: triagem.createdAt,
      updatedAt: triagem.updatedAt,
    },
  };
}

/**
 * Busca as triagens disponíveis na fila geral
 * para os médicos.
 *
 * Apenas são exibidas triagens que:
 * - estão com status Aguardando;
 * - ainda não possuem médico responsável;
 * - já foram preenchidas pela MarIA;
 * - possuem uma cor de classificação.
 *
 * A fila é organizada primeiro pela prioridade
 * e depois pelo horário de entrada.
 *
 * Utilizado pela rota:
 * GET /triagens/painel-medico
 */


async buscarPainelMedico() {
  const triagens = await this.triagemModel
    .find({
      status: TriagemStatus.AGUARDANDO,

      medico_id:null,  //

      // Evita mostrar triagens ainda vazias.
      'dados_triagem.queixa_principal': {
        $ne: null,
      },

      cor_classificacao: {
        $ne: null,
      },
    })

     /**
       * Substitui paciente_id pelos dados
       * selecionados do paciente.
       */
    .populate<{
      paciente_id: PacienteAposPopulate | null;
    }>({
      path: 'paciente_id',
      select: 'cpf email',
    })
    .sort({
      data_hora_entrada: 1,
    })
    .lean()
    .exec();
    /**
   * Define uma prioridade numérica para cada cor.
   *
   * Quanto menor o número,
   * maior a prioridade na fila.
   */
  const prioridadeCor: Record<string, number> = {
    vermelho: 1,
    amarelo: 2,
    verde: 3,
  };

   /**
   * Ordena primeiro pela cor.
   *
   * Se duas triagens tiverem a mesma cor,
   * a mais antiga aparece primeiro.
   */

  triagens.sort((triagemA, triagemB) => {
    const prioridadeA =
      prioridadeCor[
        triagemA.cor_classificacao ?? ''
      ] ?? 99;

    const prioridadeB =
      prioridadeCor[
        triagemB.cor_classificacao ?? ''
      ] ?? 99;

    if (prioridadeA !== prioridadeB) {
      return prioridadeA - prioridadeB;
    }

    return (
      new Date(
        triagemA.data_hora_entrada,
      ).getTime() -
      new Date(
        triagemB.data_hora_entrada,
      ).getTime()
    );
  });

  return {
    total_triagens: triagens.length,

    triagens: triagens.map((triagem) => ({
      id: String(triagem._id),

      paciente: {
        id: triagem.paciente_id
          ? String(triagem.paciente_id._id)
          : null,

        nome:
          triagem.dados_paciente?.nome ??
          null,

        idade:
          triagem.dados_paciente?.idade ??
          null,

        sexo:
          triagem.dados_paciente?.sexo ??
          null,

        cpf:
          triagem.paciente_id?.cpf ?? null,

        email:
          triagem.paciente_id?.email ?? null,
      },

      queixa_principal:
        triagem.dados_triagem
          ?.queixa_principal ?? null,

      sintomas:
        triagem.dados_triagem?.sintomas ??
        [],

      tempo_sintomas:
        triagem.dados_triagem
          ?.tempo_sintomas ?? null,

      intensidade:
        triagem.dados_triagem
          ?.intensidade ?? null,

      resumo:
        triagem.resumo_triagem?.resumo ??
        null,

      cor_classificacao:
        triagem.cor_classificacao ?? null,

      status: triagem.status,

      data_hora_entrada:
        triagem.data_hora_entrada,
    })),
  };
}

/**
 * Associa um médico a uma triagem
 * e registra o início do atendimento.
 *
 * O método:
 * 1. valida os IDs;
 * 2. confirma que o médico existe;
 * 3. confirma que a triagem existe;
 * 4. impede atendimento de triagem concluída;
 * 5. verifica se a MarIA já preencheu a triagem;
 * 6. impede que dois médicos assumam a mesma triagem;
 * 7. registra o médico e o horário de início.
 *
 * Utilizado pela rota:
 * PATCH /triagens/:id/iniciar-atendimento
 */
async iniciarAtendimento(
  triagem_id: string,
  iniciarAtendimentoDto: IniciarAtendimentoDto,
): Promise<TriagemDocument> {
  if (!Types.ObjectId.isValid(triagem_id)) {
    throw new BadRequestException(
      'O ID da triagem informado é inválido.',
    );
  }

  const { medico_id } = iniciarAtendimentoDto;

  if (!Types.ObjectId.isValid(medico_id)) {
    throw new BadRequestException(
      'O ID do médico informado é inválido.',
    );
  }

  /**
   * Verifica se existe um médico
   * com o ID informado.
   *
   * exists() é suficiente porque aqui
   * precisamos apenas saber se ele existe.
   */

  const medicoExiste = await this.doctorModel
    .exists({
      _id: new Types.ObjectId(medico_id),
    });

  if (!medicoExiste) {
    throw new NotFoundException(
      'Médico não encontrado.',
    );
  }

  const medicoObjectId =
    new Types.ObjectId(medico_id);

  /**
   * A busca e a atualização acontecem em uma única
   * operação. Assim, somente o primeiro médico consegue
   * preencher um medico_id que ainda esteja vazio.
   */
  const triagemAssumida =
    await this.triagemModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(triagem_id),
        status: TriagemStatus.AGUARDANDO,
        medico_id: null,
        'dados_triagem.queixa_principal': {
          $nin: [null, ''],
        },
        cor_classificacao: { $ne: null },
      },
      {
        $set: {
          medico_id: medicoObjectId,
          atendimento_iniciado_em: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

  if (triagemAssumida) {
    return triagemAssumida;
  }

  const triagem = await this.triagemModel
    .findById(triagem_id)
    .exec();

  if (!triagem) {
    throw new NotFoundException(
      'Triagem não encontrada.',
    );
  }

  if (triagem.status === TriagemStatus.CONCLUIDA) {
    throw new BadRequestException(
      'Não é possível iniciar uma triagem concluída.',
    );
  }

  if (
    !triagem.dados_triagem?.queixa_principal ||
    !triagem.cor_classificacao
  ) {
    throw new BadRequestException(
      'A triagem ainda não foi preenchida pela MarIA.',
    );
  }

  if (triagem.medico_id?.equals(medicoObjectId)) {
    return triagem;
  }

  throw new ConflictException(
    'Esta triagem já foi assumida por outro médico.',
  );
}
/**
 * Salva ou atualiza as informações registradas
 * pelo médico durante o atendimento.
 *
 * A atualização é parcial:
 * somente os campos enviados são alterados.
 *
 * O método também impede alterações em triagens
 * concluídas ou que ainda não foram assumidas
 * por um médico.
 *
 * Utilizado pela rota:
 * PATCH /triagens/:id/informacoes-medicas
 */

async salvarInformacoesMedicas(
  triagem_id: string,
  informacoesMedicasDto: InformacoesMedicasDto,
): Promise<TriagemDocument> {
  if (!Types.ObjectId.isValid(triagem_id)) {
    throw new BadRequestException(
      'O ID da triagem informado é inválido.',
    );
  }

  const triagem = await this.triagemModel
    .findById(triagem_id)
    .exec();

  if (!triagem) {
    throw new NotFoundException(
      'Triagem não encontrada.',
    );
  }

  if (
    triagem.status === TriagemStatus.CONCLUIDA
  ) {
    throw new BadRequestException(
      'Não é possível alterar uma triagem concluída.',
    );
  }

  if (!triagem.medico_id) {
    throw new BadRequestException(
      'O atendimento ainda não foi iniciado por um médico.',
    );
  }
 /**
   * Armazena somente os campos realmente
   * enviados na requisição.
   */
  const camposAtualizacao:
    Record<string, unknown> = {};

  if (informacoesMedicasDto.altura !== undefined) {
    camposAtualizacao['informacoes_medicas.altura'] =
      informacoesMedicasDto.altura;
  }

  if (informacoesMedicasDto.peso !== undefined) {
    camposAtualizacao['informacoes_medicas.peso'] =
      informacoesMedicasDto.peso;
  }

  if (
    informacoesMedicasDto.temperatura !==
    undefined
  ) {
    camposAtualizacao[
      'informacoes_medicas.temperatura'
    ] = informacoesMedicasDto.temperatura;
  }

  if (
    informacoesMedicasDto
      .frequencia_cardiaca !== undefined
  ) {
    camposAtualizacao[
      'informacoes_medicas.frequencia_cardiaca'
    ] =
      informacoesMedicasDto
        .frequencia_cardiaca;
  }

  if (
    informacoesMedicasDto
      .frequencia_respiratoria !== undefined
  ) {
    camposAtualizacao[
      'informacoes_medicas.frequencia_respiratoria'
    ] = informacoesMedicasDto.frequencia_respiratoria;
  }

  if (
    informacoesMedicasDto
      .exame_fisico_direcionado !== undefined
  ) {
    camposAtualizacao[
      'informacoes_medicas.exame_fisico_direcionado'
    ] =
      informacoesMedicasDto
        .exame_fisico_direcionado;
  }

  if (
    informacoesMedicasDto.observacoes !==
    undefined
  ) {
    camposAtualizacao[
      'informacoes_medicas.observacoes'
    ] = informacoesMedicasDto.observacoes;
  }

  if (
    Object.keys(camposAtualizacao).length === 0
  ) {
    throw new BadRequestException(
      'Envie pelo menos uma informação médica.',
    );
  }
 /**
   * A notação com ponto permite atualizar
   * apenas campos internos de informacoes_medicas
   * sem substituir o objeto inteiro.
   */
  const triagemAtualizada =
    await this.triagemModel.findByIdAndUpdate(
      triagem_id,
      {
        $set: camposAtualizacao,
      },
      {
        new: true,
        runValidators: true,
      },
    );

  if (!triagemAtualizada) {
    throw new NotFoundException(
      'Triagem não encontrada.',
    );
  }

  return triagemAtualizada;
}


/**
 * Busca os atendimentos em aberto
 * pertencentes a um médico específico.
 *
 * Diferentemente do painel geral, esta consulta
 * retorna apenas triagens que já possuem
 * o medico_id informado.
 *
 * Utilizado pela rota:
 * GET /triagens/medico/:medico_id
 */
async buscarAtendimentosDoMedico(
  medico_id: string,
) {
  if (!Types.ObjectId.isValid(medico_id)) {
    throw new BadRequestException(
      'O ID do médico informado é inválido.',
    );
  }

  const medicoExiste = await this.doctorModel
    .exists({
      _id: new Types.ObjectId(medico_id),
    });

  if (!medicoExiste) {
    throw new NotFoundException(
      'Médico não encontrado.',
    );
  }

  const triagens = await this.triagemModel
    .find({
      medico_id: new Types.ObjectId(medico_id),
      status: TriagemStatus.AGUARDANDO,
    })
     /**
       * Carrega CPF e e-mail do paciente
       * referenciado em paciente_id.
       */
    .populate<{
      paciente_id: PacienteAposPopulate | null;
    }>({
      path: 'paciente_id',
      select: 'cpf email',
    })
     /**
       * Exibe primeiro os atendimentos
       * iniciados mais recentemente.
       */
    .sort({
      atendimento_iniciado_em: -1,
    })
    .lean()
    .exec();

  return {
    medico_id,
    total_atendimentos: triagens.length,

    atendimentos: triagens.map((triagem) => ({
      id: String(triagem._id),

      paciente: {
        id: triagem.paciente_id
          ? String(triagem.paciente_id._id)
          : null,

        nome:
          triagem.dados_paciente?.nome ??
          null,

        idade:
          triagem.dados_paciente?.idade ??
          null,

        sexo:
          triagem.dados_paciente?.sexo ??
          null,

        cpf:
          triagem.paciente_id?.cpf ?? null,

        email:
          triagem.paciente_id?.email ?? null,
      },

      queixa_principal:
        triagem.dados_triagem
          ?.queixa_principal ?? null,

      sintomas:
        triagem.dados_triagem?.sintomas ??
        [],

      intensidade:
        triagem.dados_triagem
          ?.intensidade ?? null,

      cor_classificacao:
        triagem.cor_classificacao ?? null,

      resumo:
        triagem.resumo_triagem?.resumo ??
        null,

      status: triagem.status,

      atendimento_iniciado_em:
        triagem.atendimento_iniciado_em ??
        null,

      informacoes_medicas:
        triagem.informacoes_medicas,
    })),
  };
}

/**
 * Finaliza o atendimento de uma triagem.
 *
 * O método:
 * 1. valida o ID;
 * 2. verifica se a triagem existe;
 * 3. impede concluir novamente;
 * 4. confirma que um médico iniciou o atendimento;
 * 5. altera o status para Concluida;
 * 6. registra o horário da conclusão.
 *
 * Utilizado pela rota:
 * PATCH /triagens/:id/concluir
 */
async concluirAtendimento(
  triagem_id: string,
): Promise<TriagemDocument> {
  if (!Types.ObjectId.isValid(triagem_id)) {
    throw new BadRequestException(
      'O ID da triagem informado é inválido.',
    );
  }

  const triagem = await this.triagemModel
    .findById(triagem_id)
    .exec();

  if (!triagem) {
    throw new NotFoundException(
      'Triagem não encontrada.',
    );
  }

  if (
    triagem.status === TriagemStatus.CONCLUIDA
  ) {
    throw new BadRequestException(
      'Esta triagem já foi concluída.',
    );
  }

  if (!triagem.medico_id) {
    throw new BadRequestException(
      'O atendimento ainda não foi iniciado por um médico.',
    );
  }

  if (!triagem.atendimento_iniciado_em) {
    throw new BadRequestException(
      'A data de início do atendimento não foi registrada.',
    );
  }
 // Finaliza a triagem e registra o horário
  triagem.status =
    TriagemStatus.CONCLUIDA;

  triagem.atendimento_concluido_em =
    new Date();

  return triagem.save();
}





}
