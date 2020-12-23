import {LambdaProxy} from '../../../../src/decorators/lambda-proxy';


describe("inject cors tests", () => {

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
  };

  @LambdaProxy()
  class TestClass {
    public static injectCors(_event: any, _context: any) {
      return Promise.resolve();
    }
  }

  it("should inject cors headers", async () => {
    const res = await TestClass.injectCors({} as any, null);
    expect(res).toHaveProperty('headers', corsHeaders);
  });
});
