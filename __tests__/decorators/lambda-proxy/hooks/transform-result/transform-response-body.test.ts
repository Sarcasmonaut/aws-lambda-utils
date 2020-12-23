import { ResponseTransformer } from "../../../../../src/decorators/lambda-proxy/hooks/transform-result";
import { LambdaProxyOpts } from "../../../../../src/decorators/lambda-proxy";

describe("ResponseTransformer.transformResponseBody tests", () => {
  class DummyDto {}
  it("should call prepareOpts with userOpts.returns", () => {
    // @ts-ignore
    const spyPrepareOpts = jest.spyOn(ResponseTransformer, "prepareOpts");
    const userOpts: LambdaProxyOpts = { returns: DummyDto };
    ResponseTransformer.transformResponseBody({ userOpts } as any);
    expect(spyPrepareOpts).toHaveBeenCalledWith(userOpts.returns);
  });

  it("should assign result of transformToTarget to param.result ", () => {
    const mockTransformToTarget = jest.spyOn(
      ResponseTransformer,
      // @ts-ignore
      "transformToTarget"
    );
    const expectedResult = { this: "shouldBeResult" };
    mockTransformToTarget.mockImplementationOnce(() => expectedResult);
    const params: any = { userOpts: {} };
    ResponseTransformer.transformResponseBody(params as any);
    expect(params.result).toHaveProperty("body", expectedResult);
  });
});
