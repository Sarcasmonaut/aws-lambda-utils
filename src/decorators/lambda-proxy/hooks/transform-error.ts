import { ErrorHook } from "../../../hooks";
import { LambdaProxyHookParams } from "../index";

export const transformError: ErrorHook = (params: LambdaProxyHookParams) => {
  let error, message;
  if (typeof params.error === "string" || params.error == null) {
    error = "InternalServerError";
    message = params.error || error;
  } else if (params.error) {
    error = params.error.name || params.error.constructor.name;
    message = params.error.message || params.error;
  }
  params.result = {
    body: { error, message },
  };
};
