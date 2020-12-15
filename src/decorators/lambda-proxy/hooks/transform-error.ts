import {ErrorHook} from '../../../hooks';
import {LambdaProxyHookParams} from '../index';

export const transformError: ErrorHook = (params: LambdaProxyHookParams) => {
  let error, message;
  if (typeof params.error === 'string') {
    error = 'InternalServerError';
    message = params.error;
  } else {
    error = params.error!.name || params.error!.constructor.name;
    message = params.error!.message || params.error;
  }
  params.result = {
    body: {error, message}
  };

};
