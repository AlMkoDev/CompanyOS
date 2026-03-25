import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsObject, IsOptional, Max, Min } from 'class-validator';

export class UpdateCompanySetupDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  step: number;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isComplete?: boolean;
}
