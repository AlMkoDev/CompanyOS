import { IsString, Length } from 'class-validator';

export class VerifyMfaDto {
  @IsString()
  @Length(4, 12)
  code: string;
}
