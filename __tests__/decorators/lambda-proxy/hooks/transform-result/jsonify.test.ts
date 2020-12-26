import { ResponseTransformer } from "../../../../../src/decorators/lambda-proxy/hooks/transform-result";

describe("ResponseTransformer.jsonify tests", () => {
  test.each([
    ["justastring", { result: "justastring" }],
    ["justastring", { result: { body: "justastring" } }],
    [
      JSON.stringify({ should: { be: "jsonified" } }),
      { result: { should: { be: "jsonified" } } },
    ],
    [JSON.stringify({ key: "value" }), { result: { body: { key: "value" } } }],
    [undefined, {}],
  ])("should return %p if params = %p", (expected: any, params: any) => {
    ResponseTransformer.jsonify(params);
    expect(params).toHaveProperty("result");
    expect(params.result).toHaveProperty("body", expected);
  });
});
