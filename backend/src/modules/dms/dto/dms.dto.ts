import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  parent_id?: string;
}

export class UploadDocumentDto {
  @IsOptional()
  @IsString()
  folder_id?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  classification: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  file_url: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  file_type?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  size_bytes: number;
}

export class AddDocumentVersionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  fileUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  changeLog?: string;
}

export class ToggleLegalHoldDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
