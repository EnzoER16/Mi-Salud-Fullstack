import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class DoctorDetailsDto {
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
  @MaxLength(120)
  workplace?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  office_address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  attention_hours?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  accepted_insurances?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;
}