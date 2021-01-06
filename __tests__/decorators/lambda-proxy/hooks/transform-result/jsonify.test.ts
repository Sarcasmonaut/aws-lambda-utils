import { ResponseTransformer } from "../../../../../src/decorators/lambda-proxy/hooks";

describe("ResponseTransformer.jsonify tests", () => {
  test.each([
    ["justastring", { result: { body: "justastring" } }],
    [
      JSON.stringify({ should: { be: "jsonified" } }),
      { result: { body: { should: { be: "jsonified" } } } },
    ],
    [JSON.stringify({ key: "value" }), { result: { body: { key: "value" } } }],
    [undefined, {}],
    [null, { result: { body: null }}],
  ])("should return %p if params = %p", (expected: any, params: any) => {
    ResponseTransformer.jsonify(params);
    expect(params).toHaveProperty("result");
    expect(params.result).toHaveProperty("body", expected);
  });
});
