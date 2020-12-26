import { extractUser } from "../../../../../src/decorators/lambda-proxy/hooks";
import { LambdaProxyOpts } from "../../../../../src/decorators/lambda-proxy";

describe("extractUser tests", () => {
  const OLD_ENV = process.env;

  beforeAll(() => {
    process.env.NODE_ENV = "nottest";
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("should set user undefined if source invalid", async (done) => {
    const opts = { userSource: "invalid" };
    const event: any = {};
    const context: any = {};
    await extractUser({
      args: [event, context],
      decoratedFunction: null,
      userOpts: opts,
    });
    expect(event).toHaveProperty("user", undefined);
    done();
  });

  it("should be able to extract sub for userSource = cognito ", async (done) => {
    const opts: LambdaProxyOpts = { userSource: "cognito" };
    const expectedUser = "user";
    const event: any = {
      requestContext: { authorizer: { claims: { sub: expectedUser } } },
    };
    const context: any = {};
    await extractUser({
      args: [event, context],
      decoratedFunction: null,
      userOpts: opts,
    });
    expect(event).toHaveProperty("user", expectedUser);
    done();
  });

  it("should be able to extract principalId for userSource = principalId ", async (done) => {
    const opts: LambdaProxyOpts = { userSource: "principalId" };
    const expectedUser = "user";
    const event: any = {
      requestContext: { authorizer: { principalId: expectedUser } },
    };
    const context: any = {};
    await extractUser({
      args: [event, context],
      decoratedFunction: null,
      userOpts: opts,
    });
    expect(event).toHaveProperty("user", expectedUser);
    done();
  });

  it("should set user undefined if event is invalid", async (done) => {
    const opts: LambdaProxyOpts = { userSource: "principalId" };
    const event: any = { requestContext: {} };
    const context: any = {};
    await extractUser({
      args: [event, context],
      decoratedFunction: null,
      userOpts: opts,
    });
    expect(event).toHaveProperty("user", undefined);
    done();
  });

  test.each([
    ["NODE_ENV", "test"],
    ["IS_OFFLINE", "true"],
  ])(
    "should set user to LOCAL_USER if process.env.%p is %p ",
    async (envKey, val) => {
      const opts: LambdaProxyOpts = { userSource: "principalId" };
      const event: any = { requestContext: {} };
      const context: any = {};
      const original = process.env[envKey];
      process.env[envKey] = val;
      await extractUser({
        args: [event, context],
        decoratedFunction: null,
        userOpts: opts,
      });
      expect(event).toHaveProperty("user", "LOCAL_USER");
      process.env[envKey] = original;
    }
  );
});
