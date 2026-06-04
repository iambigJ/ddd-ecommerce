export class CreateProductCommand {
  constructor(
    public readonly name: string,
    public readonly price: string,
    public readonly stock: number,
  ) {}
}
