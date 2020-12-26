import { classToPlain, Expose } from "class-transformer";
import {
  BodyParser,
  ParseBodyOpts,
} from "../../../../../src/decorators/lambda-proxy/hooks/parse-request";
import { LambdaProxyHookParams } from "../../../../../src/decorators/lambda-proxy";

describe("BodyParser.parseRequestBody tests", () => {
  class TestDto {
    @Expose()
    exposed?: string;
    notExposed?: string;
  }

  test.each([
    [
      { exposed: "I am exposed", notExposed: "I am not exposed" },
      { strict: false },
      { exposed: "I am exposed", notExposed: "I am not exposed" },
    ],
    [
      { exposed: "I am exposed", notExposed: "I am not exposed" },
      { strict: true },
      { exposed: "I am exposed" },
    ],
    [
      { notExposed: "I am not exposed" },
      { strict: false },
      { exposed: undefined, notExposed: "I am not exposed" },
    ],
    [
      { notExposed: "I am not exposed", unknown: "I should`nt even be here" },
      { strict: true },
      { exposed: undefined },
    ],
    [
      { notExposed: "I am not exposed", unknown: "I should`nt even be here" },
      { strict: true, stripUndefined: true },
      {},
    ],
  ])(
    "should transform event.body successfully if valid values, input %p, opts %p, expected %p",
    async (
      body: Record<string, unknown>,
      bodyOpts: ParseBodyOpts,
      expected: Record<string, unknown>
    ) => {
      const event: any = {
        httpMethod: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      };
      const context: any = {};
      const userOpts = { body: { ...bodyOpts, type: TestDto } };
      const params: Partial<LambdaProxyHookParams> = {
        args: [event, context],
        userOpts,
      };
      await BodyParser.parseRequestBody(params as LambdaProxyHookParams);
      expect(classToPlain(event.body)).toEqual(expected);
    }
  );

  it("should return without parsing, if opts.parse = false", () => {
    // @ts-ignore
    const mockPrepareOpts = jest.spyOn(BodyParser, "prepareOpts");
    mockPrepareOpts.mockImplementationOnce(() => ({ parse: false }));

    // @ts-ignore
    const spyValidateEvent = jest.spyOn(BodyParser, "validateEvent");
    // @ts-ignore
    const spyParseJsonString = jest.spyOn(BodyParser, "parseJsonString");

    BodyParser.parseRequestBody({ args: [{}, {}], userOpts: {} } as any);
    expect(spyValidateEvent).not.toHaveBeenCalled();
    expect(spyParseJsonString).not.toHaveBeenCalled();
  });

  it("should return without parsing, if validateEvent = false", () => {
    // @ts-ignore
    const mockPrepareOpts = jest.spyOn(BodyParser, "prepareOpts");
    mockPrepareOpts.mockImplementationOnce(() => ({ parse: true }));

    // @ts-ignore
    const mockValidateEvent = jest.spyOn(BodyParser, "validateEvent");
    mockValidateEvent.mockImplementationOnce(() => false);
    // @ts-ignore
    const spyParseJsonString = jest.spyOn(BodyParser, "parseJsonString");

    BodyParser.parseRequestBody({ args: [{}, {}], userOpts: {} } as any);
    expect(mockValidateEvent).toHaveBeenCalled();
    expect(spyParseJsonString).not.toHaveBeenCalled();
  });
});
