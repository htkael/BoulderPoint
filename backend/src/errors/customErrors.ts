export class CustomNotFoundError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.statusCode = 404;
    this.name = "NotFoundError";
  }
}
export class CustomBadRequestError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.statusCode = 400;
    this.name = "BadRequestError";
  }
}
export class CustomUnauthorizedError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.statusCode = 401;
    this.name = "UnauthorizedError";
  }
}
export class CustomValidationError extends Error {
  statusCode: number;
  errors?: any;
  formData?: any;

  constructor(message: string, errors?: any, formData?: any) {
    super(message);
    this.statusCode = 422;
    this.name = "ValidationError";
    this.errors = errors || null;
    this.formData = formData || null;
  }
}
export class CustomServerError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.statusCode = 500;
    this.name = "ServerError";
  }
}
