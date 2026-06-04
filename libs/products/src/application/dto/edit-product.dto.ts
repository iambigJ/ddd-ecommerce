import { IsInt, IsNumberString, IsOptional, IsString, Min } from 'class-validator';

export class EditProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumberString()
  price?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;
}
