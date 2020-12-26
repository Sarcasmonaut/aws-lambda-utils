import { BodyParser } from "./parse-request";
import { classToPlain, ClassTransformOptions } from "class-transformer";
import { ClassType } from "class-transformer/ClassTransformer";
import { ValidationError } from "class-validator";
import { TransformationOpts } from "./index";
import { LambdaProxyHookParams } from "../index";

export interface TransformResultOpts extends TransformationOpts {
  status?: number;
}

export class ResponseTransformer extends BodyParser {
  public static transformResponseBody(params: LambdaProxyHookParams): void {
    const opts = this.prepareOpts(params.userOpts.returns);
    params.result = { body: this.transformToTarget(params.result, opts) };
  }

  public static setStatus(params: LambdaProxyHookParams): void {
    params.result = params.result || {};
    if (params.error) {
      params.result.statusCode = this.getErrorStatus(params);
    } else {
      const opts = this.prepareOpts(params.userOpts?.returns);
      params.result.statusCode = params.result.statusCode || opts.status;
    }
  }

  public static jsonify(params: LambdaProxyHookParams): void {
    const body = params.result?.body || params.result;
    if (typeof body === "string" || body == null) params.result = { body };
    else params.result = { body: JSON.stringify(body) };
  }

  protected static prepareOpts(
    optsOrTypeOrStatus:
      | TransformResultOpts
      | ClassType<unknown>
      | number
      | undefined
  ): TransformResultOpts {
    optsOrTypeOrStatus = optsOrTypeOrStatus || {};
    if (typeof optsOrTypeOrStatus === "number") {
      optsOrTypeOrStatus = { status: optsOrTypeOrStatus };
    }
    return super.prepareOpts(optsOrTypeOrStatus);
  }

  protected static getDefaultOpts(): TransformResultOpts {
    return {
      strict: false,
      stripUndefined: false,
      status: 200,
    };
  }

  protected static transformToTarget(
    body: Record<string, unknown>,
    opts: TransformResultOpts
  ): Record<string, unknown> {
    if (!opts.type) {
      return body;
    }
    const cls = super.transformToTarget(body, opts);
    return classToPlain(cls);
  }

  protected static buildTransformationOpts(
    opts: TransformResultOpts
  ): ClassTransformOptions {
    return {
      ...super.buildTransformationOpts(opts),
      strategy: "excludeAll",
      enableImplicitConversion: true,
    };
  }

  private static getErrorStatus(params: LambdaProxyHookParams): number {
    const presetCode = (params.error as any).statusCode;
    if (!presetCode) {
      // todo: gotta consider an option to inject some kind of error mapping to be able to
      // map mongoose errors for example
      if (
        params.error instanceof ValidationError ||
        (params.error && params.error.constructor.name.includes("Validation"))
      ) {
        return 400;
      }
    }
    return presetCode || 500;
  }
}
