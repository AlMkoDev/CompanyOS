import {
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateReviewCycleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;
}

export class SubmitSelfAssessmentDto {
  @IsObject()
  assessment: Record<string, unknown>;
}

export class SubmitManagerAssessmentDto {
  @IsObject()
  assessment: Record<string, unknown>;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  rating: string;
}

export class RequestFeedbackDto {
  @IsString()
  @MinLength(1)
  providerId: string;
}

export class SubmitFeedbackDto {
  @IsObject()
  answers: Record<string, unknown>;
}
