import { Request, Response, NextFunction } from "express";

interface CustomError extends Error {
  statusCode?: number;
  errors?: any;
  formData?: any;
}

interface ErrorResponse {
  success: boolean;
  message: string;
  name: string;
  errors?: any;
  formData?: any;
}

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const errorResponse: ErrorResponse = {
    success: false,
    message: err.message || "An unexpected error occurred",
    name: err.name || "Error",
  };

  console.error(`Global Error Handler: ${err}`);

  if (err.errors) {
    errorResponse.errors = err.errors;
  }

  if (err.formData) {
    errorResponse.formData = err.formData;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
