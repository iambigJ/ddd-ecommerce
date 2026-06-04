export class EditProductCommand {
  constructor(
    public readonly productId: string,
    public readonly name?: string,
    public readonly price?: string,
    public readonly stock?: number,
  ) {}
}
