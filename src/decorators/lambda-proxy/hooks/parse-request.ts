import { validateOrReject, ValidationError } from "class-validator";

import { ClassType } from "class-transformer/ClassTransformer";
import { ClassTransformOptions, plainToClass } from "class-transformer";
import { TransformationOpts } from "./index";
import { LambdaProxyHookParams } from "../index";
import {BadRequestError} from '../../../errors';

export interface ParseBodyOpts extends TransformationOpts {
  /* `true` by default - setting to FALSE will prevent the body to being parsed by JSON.parse()*/
  parse?: boolean;
  /* `true` will also call classValidator.validateOrReject. Supports only classValidator decorators. */
  validate?: boolean;
}

export class BodyParser {
  public static async parseRequestBody(
    params: LambdaProxyHookParams
  ): Promise<void> {
    const opts = this.prepareOpts(params.userOpts.body);
    const event = params.args[0];
    if (opts.parse === false || !this.validateEvent(event)) {
      return;
    }
    let body: any = this.parseJsonString(event.body);
    body = this.transformToTarget(body, opts);
    await this.validateBody(body, opts);
    event.body = body;
    return Promise.resolve();
  }

  protected static prepareOpts(
    optsOrType: ParseBodyOpts | ClassType<unknown> | undefined
  ): ParseBodyOpts {
    let opts = this.getDefaultOpts();
    if (!optsOrType) {
      return opts;
    }
    if (typeof optsOrType === "function") {
      opts.type = optsOrType;
    } else {
      opts = Object.assign(opts, optsOrType);
    }
    return opts;
  }

  protected static getDefaultOpts(): ParseBodyOpts {
    const opts: ParseBodyOpts = {
      strict: true,
      validate: true,
      stripUndefined: false,
    };
    return opts;
  }

  private static parseJsonString(body: any): Record<string, unknown> {
    try {
      return JSON.parse(body);
    } catch (error) {
      throw new BadRequestError(
        "Malformed Body. Expected stringified json content."
      );
    }
  }

  protected static transformToTarget(
    body: unknown,
    opts: ParseBodyOpts
  ): unknown {
    let transformed;
    const transformationOpts = this.buildTransformationOpts(opts);
    if (body instanceof Array) {
      transformed = body.map(() => this.transformObjectToTarget(opts, body, transformationOpts))
    } else {
      transformed = this.transformObjectToTarget(opts, body, transformationOpts);
    }
    return transformed;
  }

  protected static transformObjectToTarget(opts: ParseBodyOpts, body: unknown, transformationOpts: ClassTransformOptions) {
    if (!opts.type) {
      return body;
    }
    const transformed: any = plainToClass(opts.type, body, transformationOpts);
    if (opts.stripUndefined) {
      Object.keys(transformed).forEach((key) =>
        transformed[key] === undefined ? delete transformed[key] : {}
      );
    }
    return transformed;
  }

  protected static buildTransformationOpts(
    opts: ParseBodyOpts
  ): ClassTransformOptions {
    const excludeExtraneousValues = opts.strict;
    return { excludeExtraneousValues };
  }

  private static validateEvent(event: any): boolean {
    try {
      const supportedMethod = ["post", "put", "patch"].includes(
        event.httpMethod?.toLowerCase()
      );
      const supportedContentType =
        event.headers && event.headers["Content-Type"] === "application/json";
      const hasBody = !!event.body;
      return hasBody && supportedMethod && supportedContentType;
    } catch (error) {
      return false;
    }
  }

  private static async validateBody(body: unknown, opts: ParseBodyOpts) {
    if (!opts.validate) {
      return;
    }

    await validateOrReject(body as any).catch((errors: ValidationError[]) => {
      const message = errors
        .map((e: ValidationError) =>
          Object.values(e.constraints as Record<string, string>)
        )
        .join(".\n");
      throw new BadRequestError(message);
    });
  }
}

export const { parseRequestBody } = BodyParser;
