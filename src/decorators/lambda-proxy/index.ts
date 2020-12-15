import {LambdaProxyUserSource} from './hooks/extract-user';
import {ParseBodyOpts} from './hooks/parse-request';
import {ClassType} from 'class-transformer/ClassTransformer';
import {DecoratorFactory} from '../factory';
import {extractUser, injectCors, parseRequestBody} from './hooks';
import {transformError} from './hooks/transform-error';

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
    before: [extractUser, parseRequestBody],
    onSuccess: [],
    onError: [transformError],
    finally: [injectCors],
    // onSuccess: [transformResult],
    // finally: [transformResponseBody, setStatus]
  }, proxyOpts);
}// export type LambdaProxyBodyOptions = ParseBodyOpts | Function
