import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  priority?: string;

  @IsOptional()
  @IsString()
  asset_id?: string;
}

export class ResolveTicketDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  rca?: string;
}

export class CreateChangeRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  risk_level?: string;
}

export class UpdateChangeStatusDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  cabNotes?: string;
}

export class CreateAssetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  asset_tag: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  assigned_to_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  asset_type?: string;
}

export class CreateKnowledgeArticleDto {
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
