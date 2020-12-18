import {ResponseTransformer} from '../../../../../src/decorators/lambda-proxy/hooks/transform-result';
import {
  BadRequestError,
  DuplicateError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError
} from '../../../../../src/errors';
import {ValidationError} from 'class-validator';

describe("ResponseTransformer.setStatus tests", () => {
  class DummyDto {
  }
  class CustomValidationError {}

  test.each([
    [200, 200],
    [201, 201],
    [400, 400],
    [300, {status: 300}],
    [200, {type: DummyDto}]
  ])("should set statusCode %p if provided with opts.returns: %p", (expectedCode: number, returns: any) => {
    const userOpts = {returns};
    const params: any = {userOpts};
    ResponseTransformer.setStatus(params as any);
    expect(params).toHaveProperty('result');
    expect(params.result).toHaveProperty('statusCode', expectedCode);
  });

  test.each([
    [400, {statusCode: 400}],
    [400, new BadRequestError()],
    [400, new ValidationError()],
    [400, new CustomValidationError()],
    [401, new UnauthorizedError()],
    [403, new ForbiddenError()],
    [404, new NotFoundError()],
    [409, new DuplicateError()],
    [500, new InternalServerError()],
    [500, 'errorString'],
    [500, new Error()],
    [500, new Error()],
    [500, {error: null}],
  ])
  ("should set statusCode %p if params.error = %p ", (expectedCode: number, error: any) => {
    const params: any = {userOpts: {returns: 200}, error};
    ResponseTransformer.setStatus(params as any);
    expect(params).toHaveProperty('result');
    expect(params.result).toHaveProperty('statusCode', expectedCode);
  });

  test.each([
    [200, {result: {statusCode: 200}}],
    [400, {result: {statusCode: 400}}],
    [200, {result: {body: "string"}}],
    [200, {result: null}],
    [200, {}],
    [200, {userOpts: {returns: {type: DummyDto}}}],
    [201, {userOpts: {returns: 201}}],
    [204, {userOpts: {returns: {status: 204}}}],
    [204, {result: {statusCode: 204}, userOpts: {returns: 201}}]
  ])("should set statusCode %p if params = %p", (expectedCode: number, params: any) => {
    ResponseTransformer.setStatus(params as any);
    expect(params).toHaveProperty('result');
    expect(params.result).toHaveProperty('statusCode', expectedCode);
  });
});
