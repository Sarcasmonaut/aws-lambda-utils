import {BodyParser} from './parse-request';
import {classToPlain} from 'class-transformer';
import {ClassType} from 'class-transformer/ClassTransformer';
import {ValidationError} from 'class-validator';
import {TransformationOpts} from './index';
import {LambdaProxyHookParams} from '../index';

export interface TransformResultOpts extends TransformationOpts {
  status?: number
}

export class ResponseTransformer extends BodyParser {
  public static async transformResponseBody(params: LambdaProxyHookParams) {
    const opts = this.prepareOpts(params.userOpts.returns);
    params.result = { body: this.transformToTarget(params.result, opts) };
  }

  public static async setStatus(params: LambdaProxyHookParams) {
    params.result = params.result || {};
    if (params.error) {
      params.result.statusCode = this.getErrorStatus(params)
    } else {
      const opts = this.prepareOpts(params.userOpts?.returns);
      params.result.statusCode = params.result.statusCode || opts.status
    }
  }

  public static jsonify(params: LambdaProxyHookParams) {
    let body = params.result?.body || params.result;
    if (typeof body === 'string' || body == null)
      params.result = { body }
    else
      params.result = {body: JSON.stringify(body)};

  }

  protected static prepareOpts(optsOrTypeOrStatus: TransformResultOpts | ClassType<unknown> | number | undefined): TransformResultOpts {
    optsOrTypeOrStatus = optsOrTypeOrStatus || {};
    if (typeof optsOrTypeOrStatus === 'number') {
      optsOrTypeOrStatus = {status: optsOrTypeOrStatus};
    }
    return super.prepareOpts(optsOrTypeOrStatus);
  }

  protected static getDefaultOpts(): TransformResultOpts {
    return {
      strict: false,
      stripUndefined: false,
      status: 200
    };
  }

  protected static transformToTarget(body: any, opts: TransformResultOpts) {
    if (!opts.type) {
      return body;
    }
    const cls = super.transformToTarget(body, opts);
    return classToPlain(cls);
  }

  protected static buildTransformationOpts(opts: TransformResultOpts) {
    return {...super.buildTransformationOpts(opts), strategy: 'excludeAll', enableImplicitConversion: true};
  }

  private static getErrorStatus(params: LambdaProxyHookParams) {
      const presetCode = (params.error as any).statusCode;
      if (!presetCode) {
        // todo: gotta consider an option to inject some kind of error mapping to be able to
        // map mongoose errors for example
        if (params.error instanceof ValidationError || params.error!.constructor.name.includes('Validation')) {
          return 400;
        }
      }
      return presetCode || 500;
  }
}

export const {jsonify, transformResponseBody, setStatus} = ResponseTransformer;

