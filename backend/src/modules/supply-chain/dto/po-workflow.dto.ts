import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelAmendmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ApprovePODto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;
}

export class SendPOToSupplierDto {
  @IsOptional()
  @IsBoolean()
  emailSupplier?: boolean;

  @IsOptional()
  @IsBoolean()
  includeAcknowledgment?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customMessage?: string;
}
