// Exceções HTTP e decorator usados pelo NestJS.
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

// Permite injetar os models do Mongoose no service.
import { InjectModel } from '@nestjs/mongoose';

// Serviço responsável por criar e assinar os tokens JWT.
import { JwtService } from '@nestjs/jwt';

// Tipo usado para trabalhar com models do Mongoose.
import { Model } from 'mongoose';

// Biblioteca responsável por gerar e comparar hashes de senha.
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';

// Schema e tipo do documento de paciente.
import {
  Patient,
  PatientDocument,
} from './schemas/patient.schema';

// Schema e tipo do documento de médico.
import {
  Doctor,
  DoctorDocument,
} from './schemas/doctor.schema';

// DTO utilizado no cadastro do paciente.
import { CadastroDto } from './dto/cadastro.dto';
import { ValidateRecoveryAnswerDto } from './dto/validate-recovery-answer.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetupRecoveryDto } from './dto/setup-recovery.dto';
import { CompleteRecoverySetupDto } from './dto/complete-recovery-setup.dto';
import {
  normalizeRecoveryAnswer,
  recoveryWordsAreStrong,
} from './validators/recovery-words.validator';

// DTO utilizado no login do paciente.
import { LoginDto } from './dto/login.dto';

// DTO utilizado no login do médico.
import { LoginMedicoDto } from './dto/login-medico.dto';

// Enum que padroniza os perfis permitidos no sistema.
import { UserRole } from './enums/user-role.enum';

// Interface que define os dados armazenados dentro do JWT.
import { JwtPayload } from './interfaces/jwt-payload.interface';

/**
 * Service responsável pelas regras de autenticação
 * e cadastro de usuários do SISAT.
 *
 * Esta classe realiza:
 * - cadastro de pacientes;
 * - autenticação de pacientes;
 * - autenticação de médicos;
 * - proteção das senhas utilizando bcrypt;
 * - geração de tokens JWT após um login válido.
 *
 * O service acessa diretamente as coleções de
 * pacientes e médicos por meio dos models do Mongoose.
 */
@Injectable()
export class AuthService {
  constructor(
    /**
   * Injeta as dependências utilizadas pelo service.
   *
   * patientModel:
   * permite acessar a coleção "pacientes".
   *
   * doctorModel:
   * permite acessar a coleção "medicos".
   *
   * jwtService:
   * responsável pela geração dos tokens JWT.
   */
    @InjectModel(Patient.name)
    private readonly patientModel: Model<PatientDocument>,

    /*
     * Injeta o model responsável pela coleção "medicos".
     *
     * Não existe cadastro público de médico. Este model
     * é utilizado apenas para procurar médicos existentes.
     */
    @InjectModel(Doctor.name)
    private readonly doctorModel: Model<DoctorDocument>,

    /*
     * Injeta o serviço responsável por gerar os tokens JWT.
     */
    private readonly jwtService: JwtService,
  ) {}

  /*
   * Cadastra um novo paciente.
   *
   * Este método é chamado pela rota:
   * POST /auth/paciente/cadastro
   */
  async register(data: CadastroDto) {
    /*
     * Remove espaços desnecessários do CPF.
     *
     * O DTO já garante que o CPF tenha exatamente
     * onze números.
     */
    const cpf = data.cpf.trim();

    /*
     * Remove espaços e transforma o e-mail em letras
     * minúsculas para padronizar o armazenamento.
     */
    const email = data.email.trim().toLowerCase();

    /*
     * Impede que um paciente utilize o domínio reservado
     * aos profissionais de saúde.
     */
    if (email.endsWith('@sisat.com')) {
      throw new BadRequestException(
        'E-mails @sisat.com são exclusivos para médicos.',
      );
    }

    /*
     * Procura um paciente com o mesmo CPF.
     *
     * O método exec() executa a consulta criada pelo Mongoose.
     */
    const cpfExiste = await this.patientModel
      .findOne({ cpf })
      .exec();

    /*
     * Se o CPF já estiver cadastrado, interrompe o processo
     * e responde com HTTP 400.
     */
    if (cpfExiste) {
      throw new BadRequestException(
        'Este CPF já está cadastrado.',
      );
    }

    /*
     * Procura um paciente que já possua o mesmo e-mail.
     */
    const emailExiste = await this.patientModel
      .findOne({ email })
      .exec();

    /*
     * Impede o cadastro duplicado de e-mail.
     */
    if (emailExiste) {
      throw new BadRequestException(
        'Este e-mail já está cadastrado.',
      );
    }

    /*
     * Gera o hash da senha usando bcrypt.
     *
     * O número 10 representa o custo do processamento.
     * A senha original nunca é salva no banco.
     */
    const hashedPassword = await bcrypt.hash(
      data.password,
      10,
    );
//o cadastro aceita as três respostas juntas ou nenhuma, pois elas também podem ser configuradas na segunda etapa.
    const recoveryWords = [
      data.recoveryWord1,
      data.recoveryWord2,
      data.recoveryWord3,
    ];
    const hasRecoveryWords = recoveryWords.some((word) => word !== undefined);
    if (hasRecoveryWords && !recoveryWords.every((word) => typeof word === 'string')) {
      throw new BadRequestException('Informe as três respostas de recuperação.');
    }
    if (hasRecoveryWords && !recoveryWordsAreStrong(recoveryWords as string[])) {
      throw new BadRequestException('Escolha três respostas diferentes e menos previsíveis.');
    }

    //as respostas são normalizadas e transformadas em hashes com bcrypt; os textos originais não são salvos.
    const recoveryHashes = hasRecoveryWords
      ? await Promise.all(
          (recoveryWords as string[]).map((word) =>
            bcrypt.hash(normalizeRecoveryAnswer(word), 10),
          ),
        )
      : null;

    /*
     * Cria o documento do paciente na coleção "pacientes".
     *
     * O frontend envia o campo "password", mas no banco
     * o hash é salvo no campo "senha".
     */
    const patient = await this.patientModel.create({
      cpf,
      email,
      senha: hashedPassword,
      ...(recoveryHashes && {
        recoveryWord1Hash: recoveryHashes[0],
        recoveryWord2Hash: recoveryHashes[1],
        recoveryWord3Hash: recoveryHashes[2],
      }),
    });

    // A autorização serve apenas para configurar as respostas logo após
    // o cadastro; não é um token de login e expira em dez minutos.
    const setupToken = recoveryHashes
      ? undefined
      : await this.jwtService.signAsync(
          { sub: String(patient._id), purpose: 'setup_recovery' },
          { expiresIn: '10m' },
        );
    
    return {
      message: 'Cadastro do paciente realizado com sucesso.',
      patient: {
        id: String(patient._id),
        cpf: patient.cpf,
        email: patient.email,
      },
      ...(setupToken && { setup_token: setupToken }),
    };
  }

  /** Configura as respostas na segunda etapa do cadastro, sem reenviar a senha. */
  async completeRecoverySetup(data: CompleteRecoverySetupDto) {
    let payload: { sub?: string; purpose?: string };
    try {
      payload = await this.jwtService.verifyAsync(data.setupToken);
    } catch {
      throw new UnauthorizedException('Autorização de cadastro inválida ou expirada.');
    }
    if (!payload.sub || payload.purpose !== 'setup_recovery') {
      throw new UnauthorizedException('Autorização de cadastro inválida ou expirada.');
    }

    const words = [data.recoveryWord1, data.recoveryWord2, data.recoveryWord3];
    if (!recoveryWordsAreStrong(words)) {
      throw new BadRequestException('Escolha três respostas diferentes e menos previsíveis.');
    }
    const hashes = await Promise.all(
      words.map((word) => bcrypt.hash(normalizeRecoveryAnswer(word), 10)),
    );
    const result = await this.patientModel.updateOne(
      {
        _id: payload.sub,
        recoveryWord1Hash: { $exists: false },
        recoveryWord2Hash: { $exists: false },
        recoveryWord3Hash: { $exists: false },
      },
      {
        $set: {
          recoveryWord1Hash: hashes[0],
          recoveryWord2Hash: hashes[1],
          recoveryWord3Hash: hashes[2],
          recoveryFailedAttempts: 0,
        },
      },
    ).exec();
    if (result.matchedCount !== 1) {
      throw new UnauthorizedException('Autorização de cadastro já utilizada ou inválida.');
    }
    return { message: 'Respostas de recuperação configuradas com sucesso.' };
  }

  /** Configura ou troca as palavras mediante CPF e senha atual. */
  async setupRecovery(data: SetupRecoveryDto) {
    const patient = await this.patientModel.findOne({ cpf: data.cpf }).exec();
    const validPassword = patient
      ? await bcrypt.compare(data.currentPassword, patient.senha)
      : false;
    if (!patient || !validPassword) {
      throw new UnauthorizedException('CPF ou senha incorretos.');
    }

    const words = [data.recoveryWord1, data.recoveryWord2, data.recoveryWord3];
    if (!recoveryWordsAreStrong(words)) {
      throw new BadRequestException('Escolha três respostas diferentes e menos previsíveis.');
    }
    const hashes = await Promise.all(
      words.map((word) => bcrypt.hash(normalizeRecoveryAnswer(word), 10)),
    );
    await this.patientModel.updateOne(
      { _id: patient._id },
      {
        $set: {
          recoveryWord1Hash: hashes[0],
          recoveryWord2Hash: hashes[1],
          recoveryWord3Hash: hashes[2],
          recoveryFailedAttempts: 0,
        },
        $unset: {
          recoveryBlockedUntil: '',
          recoveryResetTokenHash: '',
          recoveryResetExpiresAt: '',
        },
      },
    ).exec();
    return { message: 'Palavras de recuperação configuradas com sucesso.' };
  }

  /** Confere uma resposta e emite uma autorização curta de redefinição. */
  //uma resposta correta entre as três basta para gerar o token temporário.
  //cinco tentativas erradas bloqueiam por cinco minutos
  async validateRecoveryAnswer(data: ValidateRecoveryAnswerDto) {
    const invalid = 'Não foi possível recuperar a senha com os dados informados.';
    const patient = await this.patientModel.findOne({ cpf: data.cpf }).exec();
    if (
      !patient?.recoveryWord1Hash ||
      !patient.recoveryWord2Hash ||
      !patient.recoveryWord3Hash ||
      (patient.recoveryBlockedUntil && patient.recoveryBlockedUntil > new Date())
    ) {
      throw new UnauthorizedException(invalid);
    }

    const hashes = [
      patient.recoveryWord1Hash,
      patient.recoveryWord2Hash,
      patient.recoveryWord3Hash,
    ];
    const normalized = normalizeRecoveryAnswer(data.answer);
    const matches = await Promise.all(
      hashes.map(async (hash) => {
        return (
          (await bcrypt.compare(normalized, hash)) ||
          // Mantém compatibilidade com hashes criados antes da normalização.
          (normalized !== data.answer && (await bcrypt.compare(data.answer, hash)))
        );
      }),
    );
    if (!matches.some(Boolean)) {
      const previousAttempts =
        patient.recoveryBlockedUntil && patient.recoveryBlockedUntil <= new Date()
          ? 0
          : (patient.recoveryFailedAttempts ?? 0);
      const attempts = previousAttempts + 1;
      await this.patientModel.updateOne(
        { _id: patient._id },
        {
          $set: {
            recoveryFailedAttempts: attempts,
            ...(attempts >= 5 && {
              recoveryBlockedUntil: new Date(Date.now() + 15 * 60 * 1000),
            }),
          },
        },
      ).exec();
      throw new UnauthorizedException(invalid);
    }

    const resetToken = randomBytes(32).toString('base64url');
    const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    await this.patientModel.updateOne(
      { _id: patient._id },
      {
        $set: {
          recoveryResetTokenHash: resetTokenHash,
          recoveryResetExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
          recoveryFailedAttempts: 0,
        },
        $unset: { recoveryBlockedUntil: '' },
      },
    ).exec();
    return { reset_token: resetToken, expires_in_seconds: 600 };
  }

  /** Consome a autorização uma única vez ao salvar a nova senha. */
  //método procura o hash do token de redefinição, verifica a validade, troca o hash da senha e remove os campos do token na mesma atualização. Isso torna a autorização de uso único.
  async resetPassword(data: ResetPasswordDto) {
    const invalid = 'Autorização de recuperação inválida ou expirada.';
    const tokenHash = createHash('sha256').update(data.resetToken).digest('hex');
    const now = new Date();
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    const result = await this.patientModel.updateOne(
      {
        recoveryResetTokenHash: tokenHash,
        recoveryResetExpiresAt: { $gt: now },
        $or: [
          { recoveryBlockedUntil: { $exists: false } },
          { recoveryBlockedUntil: { $lte: now } },
        ],
      },
      {
        $set: { senha: hashedPassword, recoveryFailedAttempts: 0 },
        $unset: {
          recoveryResetTokenHash: '',
          recoveryResetExpiresAt: '',
          recoveryBlockedUntil: '',
        },
      },
    ).exec();
    if (result.matchedCount !== 1) {
      throw new UnauthorizedException(invalid);
    }
    return { message: 'Senha redefinida com sucesso. Faça login novamente.' };
  }

  /*
   * Autentica um paciente usando CPF e senha.
   *
   * Este método é chamado pela rota:
   * POST /auth/paciente/login
   */
  async login(data: LoginDto) {
    /*
     * Remove possíveis espaços do CPF recebido.
     */
    const cpf = data.cpf.trim();

    /*
     * Procura o paciente apenas na coleção "pacientes".
     */
    const patient = await this.patientModel
      .findOne({ cpf })
      .exec();

    /*
     * Caso o CPF não exista, retorna a mesma mensagem
     * usada para senha incorreta.
     *
     * Isso evita revelar quais CPFs estão cadastrados.
     */
    if (!patient) {
      throw new UnauthorizedException(
        'CPF ou senha incorretos.',
      );
    }

    /*
     * Compara a senha digitada com o hash armazenado.
     *
     * O bcrypt não descriptografa a senha. Ele apenas
     * verifica se a senha corresponde ao hash.
     */
    const isPasswordValid = await bcrypt.compare(
      data.password,
      patient.senha,
    );

    /*
     * Caso a senha esteja errada, responde com HTTP 401.
     */
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'CPF ou senha incorretos.',
      );
    }

    /*
     * Define os dados que ficarão dentro do token JWT.
     *
     * sub representa o identificador do usuário.
     * role identifica que o usuário é um paciente.
     */
    const payload: JwtPayload = {
      sub: String(patient._id),
      cpf: patient.cpf,
      email: patient.email,
      role: UserRole.PACIENTE,
    };

    /*
     * Gera o token JWT assinado com o segredo configurado
     * no AuthModule.
     */
    const accessToken =
      await this.jwtService.signAsync(payload);

   
    return {
      message: 'Login do paciente realizado com sucesso.',
      access_token: accessToken,
      user: {
        id: String(patient._id),
        cpf: patient.cpf,
        email: patient.email,
        role: UserRole.PACIENTE,
      },
    };
  }

  /*
   * Autentica um médico usando e-mail institucional e senha.
   *
   * Este método é chamado pela rota:
   * POST /auth/medico/login
   */
  async loginMedico(data: LoginMedicoDto) {
    /*
     * Padroniza o e-mail antes de fazer a busca no banco.
     */
    const email = data.email.trim().toLowerCase();

    /*
     * O DTO já verifica o domínio, mas esta verificação
     * adicional mantém a regra também no service.
     *
     * Assim, a lógica de negócio não depende apenas
     * da validação feita pelo controller.
     */
    if (!email.endsWith('@sisat.com')) {
      throw new UnauthorizedException(
        'Utilize um e-mail institucional @sisat.com.',
      );
    }

    /*
     * Procura o médico apenas na coleção "medicos".
     */
    const doctor = await this.doctorModel
      .findOne({ email })
      .exec();

    /*
     * Se o médico não existir, retorna HTTP 401.
     *
     * A mensagem também é genérica para não informar
     * se o e-mail está ou não cadastrado.
     */
    if (!doctor) {
      throw new UnauthorizedException(
        'E-mail ou senha incorretos.',
      );
    }

    /*
     * Compara a senha digitada com o hash salvo no banco.
     */
    const isPasswordValid = await bcrypt.compare(
      data.password,
      doctor.senha,
    );

    /*
     * Bloqueia o login caso a senha esteja incorreta.
     */
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'E-mail ou senha incorretos.',
      );
    }

    /*
     * Define o conteúdo do token do médico.
     *
     * O médico não possui CPF dentro do token.
     */
    const payload: JwtPayload = {
      sub: String(doctor._id),
      email: doctor.email,
      role: UserRole.MEDICO,
    };

    /*
     * Gera o token JWT do médico.
     */
    const accessToken =
      await this.jwtService.signAsync(payload);

   
    return {
      message: 'Login médico realizado com sucesso.',
      access_token: accessToken,
      user: {
        id: String(doctor._id),
        email: doctor.email,
        role: UserRole.MEDICO,
      },
    };
  }
}
