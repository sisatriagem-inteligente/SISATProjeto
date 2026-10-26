import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import {
  IsStrongPassword,
  MaxPasswordBytes,
} from '../validators/password-strength.validator';

/**
 * Dados enviados para redefinir a senha após validar
 * uma resposta de recuperação.
 * Usado por POST /auth/paciente/redefinir-senha.
 */
export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  resetToken!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(15)
  @MaxPasswordBytes()
  @IsStrongPassword()
  newPassword!: string;
}
