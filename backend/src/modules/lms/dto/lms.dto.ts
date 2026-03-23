import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCourseDto {
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
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  delivery_mode?: string;
}

export class EnrolEmployeeDto {
  @IsString()
  @MinLength(1)
  courseId: string;

  @IsString()
  @MinLength(1)
  employeeId: string;
}

export class UpdateEnrolmentStatusDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  status: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;
}
