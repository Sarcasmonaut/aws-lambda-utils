import {DecoratorFactory} from './factory';
import {
  APIGatewayEventRequestContext,
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyResult
} from 'aws-lambda';
import {BeforeHook, ErrorHook, FinallyHook, FinallyHookParams, HookParams} from '../hooks';
import {InternalServerError} from '../errors';
import {plainToClass} from 'class-transformer';
import {ClassType} from 'class-transformer/ClassTransformer';

import {validateOrReject} from 'class-validator';

export interface LambdaProxyHookParams extends HookParams {
  decoratedFunction: APIGatewayProxyHandlerV2 | APIGatewayProxyHandler
  args: [APIGatewayProxyEvent, APIGatewayEventRequestContext]
  result?: Partial<APIGatewayProxyResult> | any
  error?: Error
}

export interface LambdaProxyBodyParsingOptions {
  validate: boolean
  type: ClassType<unknown>
  strict: boolean
}

export type LambdaProxyUserSource = 'cognito' | 'principalId'

// export type LambdaProxyBodyOptions = LambdaProxyBodyParsingOptions | Function
export interface LambdaProxyOpts {
  error?: number
  success?: number
  json?: boolean
  userSource?: LambdaProxyUserSource
  body?: LambdaProxyBodyParsingOptions | ClassType<unknown>
}

export function LambdaProxy(proxyOpts: LambdaProxyOpts = {}) {
  const opts = {json: true, ...proxyOpts};
  const extractUser: BeforeHook = (params: LambdaProxyHookParams) => {
    const event = params.args[0] || {};
    let user;
    if (opts.userSource === 'cognito') {
      user = event.requestContext?.authorizer?.claims?.sub;
    } else if (opts.userSource === 'principalId') {
      user = event.requestContext?.authorizer?.principalId;
    }
    (event as any).user = user;
  };
  const injectCors: FinallyHook = (params: LambdaProxyHookParams) => {
    const corsDefaultHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    };
    params.result.headers = {...corsDefaultHeaders, ...params.result.headers};
  };
  const parseAndValidateRequestBody: BeforeHook = async (params: LambdaProxyHookParams) => {
    let body = params.args[0].body as any;
    const parseOpts: LambdaProxyBodyParsingOptions = (opts.body as LambdaProxyBodyParsingOptions) || {
      strict: false,
      validate: true
    };
    const type = parseOpts.type || opts.body;
    if (body && type) {
      const excludeExtraneousValues = (typeof type === 'function' ? true : (parseOpts.strict || false));
      const parsed = plainToClass(type, JSON.parse(body), {excludeExtraneousValues});
      await validateOrReject(parsed as Object);
      (params.args[0].body as any) = parsed;

    }
  };

  // const parseRequestBody: BeforeHook = (params: LambdaProxyHookParams) => {
  //   const event = params.args[0] || {};
  //   const headers = event.headers || {};
  //   if (['post', 'put', 'patch'].includes(event.httpMethod?.toLowerCase()) && (headers['Content-Type'] === 'application/json' || opts.json)) {
  //     event.body = event.body ? JSON.parse(event.body) : event.body;
  //   }
  // };
  const transformResponseBody: FinallyHook = (params: LambdaProxyHookParams) => {
    params.result = params.result || {};
    const body = params.result?.body;
    params.result = {body: JSON.stringify(body || params.result)};
  };

  const setStatus: FinallyHook = (params: FinallyHookParams) => {
    params.result = params.result || {};
    params.result.statusCode = params.error ? opts.error || 500 : params.result.statusCode || opts.success || 200;
  };

  const transformError: ErrorHook = (params: LambdaProxyHookParams) => {
    params.error = params.error || new InternalServerError();
    if (params.error instanceof Array) {
      params.result = {
        error: params.error[0].constructor.name,
        message: params.error.reduce( (prev, {property, constraints}) =>
          {prev[property] = constraints;
          return prev}, {}
         )
      };
    } else {
      params.result = {
        body: {'error': params.error.name, message: params.error.message}
      };
    }

  };

  return DecoratorFactory('LambdaProxy', {
    before: [extractUser, parseAndValidateRequestBody],
    onError: [transformError],
    onSuccess: [],
    finally: [transformResponseBody, setStatus, injectCors]
  });
};
