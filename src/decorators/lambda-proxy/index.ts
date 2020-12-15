import {LambdaProxyUserSource} from './hooks/extract-user';
import {ParseBodyOpts, parseRequestBody} from './hooks/parse-request';
import {ClassType} from 'class-transformer/ClassTransformer';
import {DecoratorFactory} from '../factory';

export interface LambdaProxyOpts {
  error?: number
  success?: number
  json?: boolean
  userSource?: LambdaProxyUserSource
  body?: ParseBodyOpts | ClassType<unknown>
  returns?: ClassType<unknown>
}

export function LambdaProxy(proxyOpts: LambdaProxyOpts) {
  return DecoratorFactory('LambdaProxy', {
    before: [parseRequestBody]
    // before: [extractUser, parseRequestBody, parseAndValidateRequestBody],
    // onError: [transformError],
    // onSuccess: [transformResult],
    // finally: [transformResponseBody, setStatus, injectCors]
  }, proxyOpts);
}// export type LambdaProxyBodyOptions = ParseBodyOpts | Function
