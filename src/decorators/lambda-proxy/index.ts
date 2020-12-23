import {LambdaProxyUserSource} from "./hooks/extract-user";
import {ClassType} from "class-transformer/ClassTransformer";
import {DecoratorFactory} from "../factory";
import {BodyParser, extractUser, injectCors, ParseBodyOpts, ResponseTransformer, TransformResultOpts} from "./hooks";
import {transformError} from "./hooks/transform-error";
import {HookParams} from "../../hooks";
import {
  APIGatewayEventRequestContext,
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyResult,
} from "aws-lambda";

export interface LambdaProxyOpts {
  userSource?: LambdaProxyUserSource;
  body?: ParseBodyOpts | ClassType<unknown>;
  returns?: TransformResultOpts | ClassType<unknown> | number;
}

export function LambdaProxy(
  proxyOpts?: LambdaProxyOpts
): any {

  async function parseRequest(params: LambdaProxyHookParams) {
    await BodyParser.parseRequestBody(params);
  }

  async function jsonify(params: LambdaProxyHookParams) {
    await ResponseTransformer.jsonify(params);
  }

  async function transformResponseBody(params: LambdaProxyHookParams) {
    await ResponseTransformer.transformResponseBody(params);
  }

  async function setStatus(params: LambdaProxyHookParams) {
    await ResponseTransformer.setStatus(params);
  }

  return DecoratorFactory(
    "LambdaProxy",
    {
      before: [extractUser, parseRequest],
      onSuccess: [transformResponseBody],
      onError: [transformError],
      finally: [jsonify, setStatus, injectCors],
    },
    proxyOpts || {}
  );
}

export interface LambdaProxyHookParams extends HookParams {
  decoratedFunction: APIGatewayProxyHandlerV2 | APIGatewayProxyHandler;
  args: [APIGatewayProxyEvent, APIGatewayEventRequestContext];
  result?: Partial<APIGatewayProxyResult> | any;
  error?: Error | string;
  userOpts: LambdaProxyOpts;
}
