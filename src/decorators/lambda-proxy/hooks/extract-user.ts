import {BeforeHook} from '../../../hooks';
import {LambdaProxyHookParams} from '../index';

export const extractUser: BeforeHook = (params: LambdaProxyHookParams) => {
  const opts = params.userOpts;
  const event = params.args[0] || {};
  let user;

  if (opts.userSource === 'cognito') {
    user = event.requestContext?.authorizer?.claims?.sub;
  } else if (opts.userSource === 'principalId') {
    user = event.requestContext?.authorizer?.principalId;
  }
  if (!user && (process.env.IS_OFFLINE || process.env.NODE_ENV?.toLowerCase() === 'test')) {
    user = 'LOCAL_USER';
  }
  (event as any).user = user;
};
export type LambdaProxyUserSource = 'cognito' | 'principalId'
