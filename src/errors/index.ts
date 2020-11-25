export class InternalServerError extends Error {
  public statusCode = 500
}

export class BadRequestError extends Error {
  public name = "BadRequest"
  public statusCode = 400
}
