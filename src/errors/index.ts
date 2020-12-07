export class InternalServerError extends Error {
  public name = "InternalServerError";
  public statusCode = 500;
}

export class BadRequestError extends Error {
  public name = "BadRequest";
  public statusCode = 400;
}

export class ForbiddenError extends Error {
  public name = "ForbiddenError";
  public statusCode = 403;
}

export class NotFoundError extends Error {
  public name = "NotFoundError";
  public statusCode = 404;
}
