import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import {
  IsStrongPassword,
  MaxPasswordBytes,
} from '../validators/password-strength.validator';

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
