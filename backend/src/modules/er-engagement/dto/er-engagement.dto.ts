import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateErTicketDto {
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
  category?: string;
}

export class CreateErCaseDetailsDto {
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
  severity?: string;
}

export class CreateErCaseDto {
  @IsString()
  @MinLength(1)
  employeeId: string;

  data: CreateErCaseDetailsDto;
}
