import { IsInt, IsNumberString, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsNumberString()
  price!: string;

  @IsInt()
  @Min(0)
  stock!: number;
}
