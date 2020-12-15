import {BodyParser, ParseBodyOpts} from '../../../../../src/decorators/lambda-proxy/hooks/parse-request';


describe("BodyParser.prepareOpts tests", () => {
  class DummyDto {
  }

  it("should wrap `body` as type in default opts if provided as ClassType<>", () => {
    const bodyType = DummyDto;
    // @ts-ignore
    const preparedOpts = BodyParser.prepareOpts(bodyType);
    expect(preparedOpts).toHaveProperty('type', bodyType);
    expect(preparedOpts).toHaveProperty('strict', true);
    expect(preparedOpts).toHaveProperty('validate', true);
    expect(preparedOpts).toHaveProperty('stripUndefined', false);
  });

  it("should merge provided opts with defaults", () => {
    const defaults = {strict: true, validate: true, stripUndefined: false};
    const parseOpts: ParseBodyOpts = {type: DummyDto};
    // @ts-ignore
    const res = BodyParser.prepareOpts(parseOpts);
    const expectedRes = {...defaults, ...parseOpts};
    expect(res).toEqual(expectedRes);
  });

  it("should override defaults with user attributes", () => {
    const parseOpts: ParseBodyOpts = {strict: false, validate: false, stripUndefined: true};
    // @ts-ignore
    const res = BodyParser.prepareOpts(parseOpts);
    expect(res).toEqual(parseOpts);
  });

  it("will return defaults if no or null param provided", () => {
    const defaults = {strict: true, validate: true, stripUndefined: false};
    // @ts-ignore
    const res = BodyParser.prepareOpts(undefined);
    expect(res).toEqual(defaults);
  });


});
