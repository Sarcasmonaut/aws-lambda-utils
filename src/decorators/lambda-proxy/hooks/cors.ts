import {FinallyHook} from '../../../hooks';
import {LambdaProxyHookParams} from '../index';

export const injectCors: FinallyHook = (params: LambdaProxyHookParams) => {
  const corsDefaultHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true
  };
  params.result.headers = {...corsDefaultHeaders, ...params.result.headers};
};
