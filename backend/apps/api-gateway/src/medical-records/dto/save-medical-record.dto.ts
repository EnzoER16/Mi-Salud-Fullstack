import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { BLOOD_GROUPS } from '@app/contracts';

function parseNumber(value: unknown): unknown {
  if (value === null || value === '') return null;

  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    return normalized ? Number(normalized) : null;
  }

  return value;
}

export class SaveMedicalRecordDto {
  @IsOptional()
  @IsIn([...BLOOD_GROUPS])
  blood_group?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  allergies?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  antecedents?: string | null;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsNumber()
  @Min(1)
  @Max(500)
  weight_kg?: number | null;

  @IsOptional()
  @Transform(({ value }) => parseNumber(value))
  @IsInt()
  @Min(30)
  @Max(260)
  height_cm?: number | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  conditions?: string[] | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  intolerances?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  surgeries?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  family_history?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  current_medication?: string | null;

  @IsOptional()
  @IsBoolean()
  wears_glasses?: boolean | null;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  last_checkup?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  last_dental_checkup?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  primary_doctor_name?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  @Matches(/^(?=(?:\D*\d){6,15}\D*$)[0-9+()\s-]+$/)
  primary_doctor_phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  care_center?: string | null;
}