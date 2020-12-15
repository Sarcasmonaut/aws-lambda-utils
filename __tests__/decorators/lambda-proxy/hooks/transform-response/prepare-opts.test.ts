import {
  ResponseTransformer,
  TransformResultOpts
} from '../../../../../src/decorators/lambda-proxy/hooks/transform-result';

describe("ResponseTransformer.prepareOpts test", () => {
  class DummyDto {
  }

  it("should wrap `returns` as status in default opts if is number", () => {
    const status = 300;
    // @ts-ignore
    const opts = ResponseTransformer.prepareOpts(status);
    expect(opts).toHaveProperty('status', status);
    expect(opts).toHaveProperty('stripUndefined', false);
  });

  it("should wrap `returns` as type in default opts if is ClassType", () => {
    const returnType = DummyDto;
    // @ts-ignore
    const opts = ResponseTransformer.prepareOpts(returnType);
    expect(opts).toHaveProperty('type', returnType);
  });

  it("should merge provided opts with defaults", () => {
    const defaults = {stripUndefined: false};
    const parseOpts: TransformResultOpts = {type: DummyDto, status: 300, stripUndefined: true};
    // @ts-ignore
    const res = ResponseTransformer.prepareOpts(parseOpts);
    const expectedRes = {...defaults, ...parseOpts};
    expect(res).toEqual(expectedRes);
  });
});
