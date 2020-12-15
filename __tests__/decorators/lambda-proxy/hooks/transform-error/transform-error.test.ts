import {LambdaProxyHookParams} from '../../../../../src/decorators/lambda';
import {transformError} from '../../../../../src/decorators/lambda-proxy/hooks/transform-error';
import {BadRequestError} from '../../../../../src/errors';

describe("transformError tests", () => {
  test.each([
    ['a simple string', {error: 'InternalServerError', message: 'a simple string'}],
    [{name: 'expectedName', message: 'expectedMessage'}, {error: 'expectedName', message: 'expectedMessage'}],
    [new BadRequestError("error message"), {error: 'BadRequest', message: 'error message'}],
    [new Error("error message"), {error: 'Error', message: 'error message'}],
    [{noMessage:"error message"}, {error: 'Object', message: {noMessage:"error message"}}],
  ])(
    "it should transformError as expected. params.error: %p, expected outcome: %p",
    (error: any, expected: any) => {
      const result: any = {};
      const params: Partial<LambdaProxyHookParams> = {
        result, error
      };
      transformError(params as LambdaProxyHookParams);
      expect(params.result.body).toEqual(expected);
    }
  )
});
