import { APIGatewayProxyWithCognitoAuthorizerEvent } from "aws-lambda";
import { LambdaProxy } from "../../../src/decorators/lambda-proxy";
import { Expose } from "class-transformer";
import { IsDefined } from "class-validator";

describe("LambdaProxy tests", () => {
  class TestDto {
    @Expose()
    @IsDefined()
    exposed?: string;
    notExposed?: string;
  }

  @LambdaProxy()
  class DecoratedClass {
    instanceMethod(
      _event: APIGatewayProxyWithCognitoAuthorizerEvent,
      _context: any
    ) {
      return Promise.resolve({});
    }

    static async undecoratedMethod(
      event: APIGatewayProxyWithCognitoAuthorizerEvent,
      _context: any
    ) {
      return Promise.resolve(event);
    }

    @LambdaProxy({ returns: 300 })
    static async overrideStatus300(
      _event: APIGatewayProxyWithCognitoAuthorizerEvent,
      _context: any
    ) {
      return Promise.resolve({});
    }

    @LambdaProxy({ body: TestDto })
    static async expectTestDto(
      event: APIGatewayProxyWithCognitoAuthorizerEvent,
      _context: any
    ) {
      return Promise.resolve(event.body);
    }

    @LambdaProxy({ body: { type: TestDto, validate: false } })
    static async expectTestDtoNoValidate(
      event: APIGatewayProxyWithCognitoAuthorizerEvent,
      _context: any
    ) {
      return Promise.resolve(event.body);
    }
  }

  function preparePostEvent(
    body: Record<string, unknown> = { key: "value" },
    user = "user",
    userSource = "cognito"
  ) {
    const event: Record<string, any> = {
      body: JSON.stringify(body),
      httpMethod: "POST",
      headers: { "Content-Type": "application/json" },
      multiValueHeaders: {},
      isBase64Encoded: false,
      requestContext: { authorizer: {} },
    };

    if (userSource === "cognito") {
      event.requestContext.authorizer = { claims: { sub: user } };
    } else if (userSource === "principalId") {
      event.requestContext.authorizer = { principalId: user };
    }
    return event as APIGatewayProxyWithCognitoAuthorizerEvent;
  }

  it("should apply class decorator to all staticMethods", async () => {
    const body = { 'key': 'value' }
    const event = preparePostEvent(body);
    const res = await DecoratedClass.undecoratedMethod(event, {});
    expect(res).toHaveProperty("statusCode", 200);
    const expected = {
      ...event,
      body: body,
      user: "LOCAL_USER",
    };
    expect(res).toHaveProperty("body", JSON.stringify(expected));
  });

  it("should apply class decorator to all instanceMethods", async () => {
    const event = preparePostEvent();
    const res = await new DecoratedClass().instanceMethod(event, {});
    expect(res).toHaveProperty("statusCode", 200);
  });

  test("method decorator overrides classDecorator", async () => {
    const event = preparePostEvent();
    const res = await DecoratedClass.overrideStatus300(event, {});
    expect(res).toHaveProperty("statusCode", 300);
  });

  it("should return statusCode 400 if specified body type isn't met", async () => {
    const failingBody = { not: "matched" };
    const event = preparePostEvent(failingBody);
    const res = await DecoratedClass.expectTestDto(event, {});
    expect(res).toHaveProperty("statusCode", 400);
    expect(res).toHaveProperty(
      "body",
      '{"error":"BadRequest","message":"exposed should not be null or undefined"}'
    );
  });

  it("should not return statusCode 400 if validate=false", async () => {
    const failingBody = { not: "matched" };
    const event = preparePostEvent(failingBody);
    const res = await DecoratedClass.expectTestDtoNoValidate(event, {});
    expect(res).toHaveProperty("statusCode", 200);
    expect(res).toHaveProperty("body", JSON.stringify(new TestDto()));
  });
  
});
