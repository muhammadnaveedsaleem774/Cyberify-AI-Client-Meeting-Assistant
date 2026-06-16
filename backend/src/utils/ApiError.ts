export class ApiError extends Error {
  status: number;
  statusCode: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusCode = status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export default ApiError;
