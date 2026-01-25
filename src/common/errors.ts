import { StatusCodes } from 'http-status-codes';

export class HttpError extends Error {
  public constructor(
    public readonly status: number,
    message: string,
    public override readonly cause?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string, cause?: unknown): HttpError => new HttpError(StatusCodes.BAD_REQUEST, message, cause);
export const notFound = (message: string, cause?: unknown): HttpError => new HttpError(StatusCodes.NOT_FOUND, message, cause);
export const internalServerError = (message: string, cause?: unknown): HttpError => new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, message, cause);
