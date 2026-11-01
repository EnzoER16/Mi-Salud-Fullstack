import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PatientProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username!: string;

  @IsString()
  @Matches(/^\d{7,8}$/, {
    message: 'El DNI debe contener 7 u 8 dígitos',
  })
  dni!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  health_insurance?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  plan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  member_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  address?: string;
}