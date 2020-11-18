import {DecoratorFactory, FinallyHook, FinallyHookParams} from './factory';
import {APIGatewayProxyHandler, APIGatewayProxyHandlerV2, APIGatewayProxyResult} from 'aws-lambda';

import * as _ from "lodash";
export interface LambdaProxyHookParams extends FinallyHookParams {
  decoratedFunction: APIGatewayProxyHandlerV2 | APIGatewayProxyHandler
  args: any
  result?: APIGatewayProxyResult
  error?: Error
}


const injectCors: FinallyHook = (params: LambdaProxyHookParams) => {
  const corsDefaultHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true
  };
  params.result!.headers = {...params.result!.headers, ...corsDefaultHeaders};
};

export interface LambdaProxyStatusOpts {

}
export interface LambdaProxyOpts {
  error?: number
  success?: number
}

export const LambdaProxy = (proxyOpts: LambdaProxyOpts = {}) => {
  const opts = { success: 200, error: 500, ...proxyOpts}
  const setStatus: FinallyHook = (params: FinallyHookParams) => {
    params.result = params.result || {}
    params.result.statusCode = params.error ? opts.error : opts.success
  }

  return  DecoratorFactory('LambdaProxy', {
    before: [],
    onError: [],
    onSuccess: [],
    finally: [setStatus, injectCors]

  });

};
