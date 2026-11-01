import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const SEX_OPTIONS = [
  'Femenino',
  'Masculino',
  'Otro',
  'Prefiero no decirlo',
];

const MARITAL_OPTIONS = [
  'Soltero/a',
  'Casado/a',
  'Unión convivencial',
  'Divorciado/a',
  'Viudo/a',
];

export class PatientDetailsDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  first_name?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  last_name?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  })
  birth_date?: string | null;

  @IsOptional()
  @IsIn(SEX_OPTIONS)
  sex?: string | null;

  @IsOptional()
  @IsIn(MARITAL_OPTIONS)
  marital_status?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  occupation?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  @Matches(/^(?=(?:\D*\d){6,15}\D*$)[0-9+()\s-]+$/, {
    message: 'El teléfono debe contener entre 6 y 15 dígitos',
  })
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  locality?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  province?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9 ]{3,10}$/, {
    message: 'Código postal inválido',
  })
  postal_code?: string | null;
}