import {DecoratorFactory} from './factory';
import {
  APIGatewayEventRequestContext,
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyResult
} from 'aws-lambda';
import {BeforeHook, ErrorHook, FinallyHook, FinallyHookParams, HookParams} from '../hooks';
import {BadRequestError} from '../errors';
import {plainToClass} from 'class-transformer';
import {ClassType} from 'class-transformer/ClassTransformer';

import {validateOrReject, ValidationError} from 'class-validator';

export interface LambdaProxyHookParams extends HookParams {
  decoratedFunction: APIGatewayProxyHandlerV2 | APIGatewayProxyHandler
  args: [APIGatewayProxyEvent, APIGatewayEventRequestContext]
  result?: Partial<APIGatewayProxyResult> | any
  error?: Error
}

export interface LambdaProxyBodyParsingOptions {
  /// `true` will also call classValidator.validateOrReject. Supports only classValidator decorators.
  validate?: boolean
  /// the class in which the body shall be tried to be parsed into
  type: ClassType<unknown>
  /// `true` will filter out all values that aren't decorated with @Expose
  strict?: boolean
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
      if (typeof body === 'string')
        body = JSON.parse(body);
      const excludeExtraneousValues = (typeof type === 'function' ? true : (parseOpts.strict || false));
      const parsed = plainToClass(type, body, {excludeExtraneousValues});
      await validateOrReject(parsed as Object).catch((errors: ValidationError[]) => {
        const message = errors.map((e: ValidationError) => Object.values(e.constraints as Record<string, string>)).join('.\n');
        throw new BadRequestError(message);
      });
      (params.args[0].body as any) = parsed;
    }
  };

  const parseRequestBody: BeforeHook = (params: LambdaProxyHookParams) => {
    const event = params.args[0] || {};
    const headers = event.headers || {};
    if (['post', 'put', 'patch'].includes(event.httpMethod?.toLowerCase()) && (headers['Content-Type'] === 'application/json' || opts.json)) {
      event.body = event.body ? JSON.parse(event.body) : event.body;
    }
  };

  const transformResponseBody: FinallyHook = (params: LambdaProxyHookParams) => {
    params.result = params.result || {};
    const body = params.result?.body;
    params.result = {body: JSON.stringify(body || params.result)};
  };

  function getErrorStatus(params: FinallyHookParams) {
    const presetCode = opts.error || (params.error as any).statusCode;
    if (!presetCode) {
      if (params.error instanceof ValidationError) {
        return 400;
      }
    }
    return presetCode || 500;
  }

  const setStatus: FinallyHook = (params: FinallyHookParams) => {
    params.result = params.result || {};
    params.result.statusCode = params.error ? getErrorStatus(params) : params.result.statusCode || opts.success || 200;
  };

  const transformError: ErrorHook = (params: LambdaProxyHookParams) => {

    if (typeof params.error === 'string') {
      params.result = {
        body: {'error': 'InternalServerError', message: params.error}
      };
    } else {
      params.result = {
        body: {
          error: params.error!.name || params.error!.constructor.name,
          message: params.error!.message || params.error
        }
      }
    }
  };

  return DecoratorFactory('LambdaProxy', {
    before: [extractUser, parseRequestBody, parseAndValidateRequestBody],
    onError: [transformError],
    onSuccess: [],
    finally: [transformResponseBody, setStatus, injectCors]
  });
};
