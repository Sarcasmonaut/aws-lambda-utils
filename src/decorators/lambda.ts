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


export interface LambdaProxyHookParams extends HookParams {
  decoratedFunction: APIGatewayProxyHandlerV2 | APIGatewayProxyHandler
  args: [APIGatewayProxyEvent, APIGatewayEventRequestContext]
  result?: Partial<APIGatewayProxyResult> | any
  error?: Error
}

export interface LambdaProxyOpts {
  error?: number
  success?: number
  json?: boolean
}

export function LambdaProxy(proxyOpts: LambdaProxyOpts = {}) {
  const opts = {json: true, ...proxyOpts};

  const injectCors: FinallyHook = (params: LambdaProxyHookParams) => {
    const corsDefaultHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    };
    params.result.headers = {...corsDefaultHeaders, ...params.result.headers};
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

  const setStatus: FinallyHook = (params: FinallyHookParams) => {
    params.result = params.result || {};
    params.result.statusCode = params.error ? opts.error || 500 : params.result.statusCode || opts.success || 200;
  };

  const transformError: ErrorHook = (params: LambdaProxyHookParams) => {
    params.error = params.error || new InternalServerError();
    params.result = {
      body: {'error': params.error.name, message: params.error.message}
    };
  };

  return DecoratorFactory('LambdaProxy', {
    before: [parseRequestBody],
    onError: [transformError],
    onSuccess: [],
    finally: [transformResponseBody, setStatus, injectCors]
  });
};
