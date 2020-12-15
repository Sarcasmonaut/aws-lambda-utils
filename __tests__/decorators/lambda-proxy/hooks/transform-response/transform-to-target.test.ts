import {
  ResponseTransformer,
  TransformResultOpts
} from '../../../../../src/decorators/lambda-proxy/hooks/transform-result';
import * as classTransformer from 'class-transformer';
import {Expose} from 'class-transformer';

describe("ResultTransformer.transformToTarget tests", () => {
  const mockPlainToClass = jest.spyOn(classTransformer, 'plainToClass');
  class TestDto {
    @Expose()
    message?: string;
    @Expose()
    exposed?: string;
    notExposed?: string;
  }


  beforeEach(() => {
    mockPlainToClass.mockClear();
  });
  afterAll(() => {
    jest.resetModules();
  });

  it("should return the body unmodified if !opts.type", () => {
    const body = {message: 'test'};
    // @ts-ignore
    const res = ResponseTransformer.transformToTarget(body, {});
    expect(res).toEqual(body);
  });

  test.each([true, false])
  ("will call plainToClass with body, opts.type and opts.strict=%p", (strict) => {
    const opts = {type: TestDto, strict};
    const body = {message: 'test'};
    mockPlainToClass.mockImplementationOnce((input) => input);

    // @ts-ignore
    ResponseTransformer.transformToTarget(body, opts);
    expect(mockPlainToClass).toHaveBeenCalledTimes(1);
    expect(mockPlainToClass).toHaveBeenCalledWith(opts.type, body, {
      enableImplicitConversion: true,
      excludeExtraneousValues: opts.strict,
      strategy: "excludeAll",
    });
  });
  test.each([false, null, undefined, 0])
  ("[ %p ] will not remove undefined values if opts.stripUndefined falsey", (strip: any) => {
    const opts: TransformResultOpts = {type: TestDto, stripUndefined: strip, strict: false};
    const body = {};
    // @ts-ignore
    const res = ResponseTransformer.transformToTarget(body, opts);
    expect(res).toHaveProperty('message', undefined);
  });


});
