import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
export const ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  //wrong mongodb id error
  if (err.name === "CastError") {
    // castrError=> mongodb id error
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Duplicate key error

  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  // Wrong Jwt error

  if (err.name == "JsonWebTokenError") {
    const message = "JWT token is invalid. Please enter a valid JWT token";
    err = new ErrorHandler(message, 400);
  }

  // JWT token is expired

  if (err.name == "TokenExpiredError") {
    const message = "JWT token is expired. Please try again later.";
    err = new ErrorHandler(message, 400);
  }
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
