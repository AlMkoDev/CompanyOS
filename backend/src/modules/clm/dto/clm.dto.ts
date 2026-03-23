import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContractTemplateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;
}

export class CreateContractDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  party_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class GenerateContractFromTemplateDto {
  @IsString()
  @MinLength(1)
  templateId: string;

  @IsObject()
  variables: Record<string, string>;
}

export class SubmitContractApprovalDto {
  @IsArray()
  approverIds: string[];
}

export class DecideContractApprovalDto {
  @IsString()
  @MinLength(1)
  decision: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

export class SignContractDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  ip: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  userAgent: string;
}
