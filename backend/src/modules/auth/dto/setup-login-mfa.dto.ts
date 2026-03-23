import { IsString, Length } from 'class-validator';

export class SetupLoginMfaDto {
  @IsString()
  token!: string;
}

export class VerifyLoginMfaSetupDto {
  @IsString()
  token!: string;

  @IsString()
  @Length(6, 10)
  code!: string;
}
