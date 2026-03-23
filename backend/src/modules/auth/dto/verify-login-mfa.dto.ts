import { IsString, Length, MinLength } from 'class-validator';

export class VerifyLoginMfaDto {
  @IsString()
  @Length(4, 12)
  code: string;

  @IsString()
  @MinLength(20)
  token: string;
}
