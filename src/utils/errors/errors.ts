export class SimpleError extends Error {
  error: any;
  constructor(message: string, name = 'SimpleError', error: any) {
    super(message);
    this.error = error ?? this;
  }
}
