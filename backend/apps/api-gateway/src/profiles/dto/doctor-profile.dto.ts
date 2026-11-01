import {
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class DoctorProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  specialty!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  license_number!: string;
}