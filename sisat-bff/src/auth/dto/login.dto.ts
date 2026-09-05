// Importa os validadores usados no login do paciente.
import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/**
 * Define e valida os dados recebidos durante
 * o login de um paciente.
 *
 * Utilizado pela rota:
 * POST /auth/paciente/login
 */
export class LoginDto {
  /**
   * CPF utilizado para identificar o paciente.
   *
   * Deve conter exatamente 11 números
   * e ser enviado sem máscara.
   */
  @IsNotEmpty({
    message: 'O CPF é obrigatório.',
  })

  
  @IsString({
    message: 'O CPF deve ser enviado como texto.',
  })

 
  @Length(11, 11, {
    message: 'O CPF deve conter exatamente 11 dígitos.',
  })

 
  @Matches(/^\d{11}$/, {
    message: 'O CPF deve conter apenas números.',
  })
  cpf!: string;

   /**
   * Senha informada pelo paciente para autenticação.
   *
   * O AuthService compara essa senha com o hash
   * armazenado no banco utilizando bcrypt.
   */
  @IsNotEmpty({
    message: 'A senha é obrigatória.',
  })

 
  @IsString({
    message: 'A senha deve ser um texto.',
  })
  password!: string;
}

/*Por que o login não possui @MinLength(6)?

Não é obrigatório validar o tamanho durante o login.

A senha já foi validada no cadastro. No login, o backend precisa apenas comparar a senha recebida com o hash armazenado:

bcrypt.compare(data.password, patient.senha);

Mesmo assim, adicionar @MinLength(6) também seria válido. Apenas não é necessário para o funcionamento.* */