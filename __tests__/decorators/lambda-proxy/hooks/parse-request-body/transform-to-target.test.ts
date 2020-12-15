import {BodyParser, ParseBodyOpts} from '../../../../../src/decorators/lambda-proxy/hooks/parse-request';
import * as classTransformer from 'class-transformer';
import {Expose} from 'class-transformer';

describe("BodyParser.transformToTarget tests", () => {
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

  it("should return the body unmodified if !opts.type", () => {
    const body = {message: 'test'};
    // @ts-ignore
    const res = BodyParser.transformToTarget(body, {});
    expect(res).toEqual(body);
  });

  test.each([true, false])
  ("will call plainToClass with body, opts.type and opts.strict=%p", (strict) => {
    const opts = {type: TestDto, strict};
    const body = {message: 'test'};
    mockPlainToClass.mockImplementationOnce((input) => input);

    // @ts-ignore
    BodyParser.transformToTarget(body, opts);
    expect(mockPlainToClass).toHaveBeenCalledTimes(1);
    expect(mockPlainToClass).toHaveBeenCalledWith(opts.type, body, {excludeExtraneousValues: opts.strict});
  });

  test.each([false, null, undefined, 0])
  ("[ %p ] will not remove undefined values if opts.stripUndefined falsey", (strip: any) => {
    const opts: ParseBodyOpts = {type: TestDto, stripUndefined: strip, strict: false};
    const body = {};
    // @ts-ignore
    const res = BodyParser.transformToTarget(body, opts);
    expect(res).toHaveProperty('message', undefined);
  });

  test.each([1, 'something', true, [1]])("[ %p ] will remove undefined values if opts.stripUndefined truthy", (strip: any) => {
    const opts: ParseBodyOpts = {type: TestDto, stripUndefined: strip, strict: false};
    const body = {};
    // @ts-ignore
    const res = BodyParser.transformToTarget(body, opts);
    expect(res).not.toHaveProperty('message');
  });

  it("should only return exposed fields if strict is true", () => {
    const opts = {type: TestDto, strict: true};
    const body = {exposed: 'I shall prevail', notExposed: 'I will perish', unknown: 'I shouldn`t even be here'};

    // @ts-ignore
    const res = BodyParser.transformToTarget(body, opts);
    expect(res).toHaveProperty('exposed', body.exposed);
    expect(res).not.toHaveProperty('notExposed');
    expect(res).not.toHaveProperty('unknown');
  });

  it("should not filter unexposed fields if strict is false", () => {
    const opts = {type: TestDto, strict: false};
    const body = {exposed: 'I shall prevail', notExposed: 'I must not fail', unknown: 'Mercy!'};

    // @ts-ignore
    const res = BodyParser.transformToTarget(body, opts);
    expect(res).toHaveProperty('exposed', body.exposed);
    expect(res).toHaveProperty('notExposed', body.notExposed);
    expect(res).toHaveProperty('unknown', body.unknown);
  });

});
