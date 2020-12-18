import { LambdaProxyUserSource } from "./hooks/extract-user";
import { ParseBodyOpts } from "./hooks/parse-request";
import { ClassType } from "class-transformer/ClassTransformer";
import { DecoratorFactory } from "../factory";
import { extractUser, injectCors, parseRequestBody } from "./hooks";
import { transformError } from "./hooks/transform-error";
import {
  jsonify,
  setStatus,
  transformResponseBody,
  TransformResultOpts,
} from "./hooks/transform-result";
import { HookParams } from "../../hooks";
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
): ClassDecorator | PropertyDecorator | MethodDecorator {
  return DecoratorFactory(
    "LambdaProxy",
    {
      before: [extractUser, parseRequestBody],
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
