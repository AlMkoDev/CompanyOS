import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateCashForecastDto {
  @IsDateString()
  startDate: string;
}

export class CreateCashItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  category: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  scenario?: string;
}
