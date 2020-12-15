import {LambdaProxyHookParams} from '../../lambda';
import {plainToClass} from 'class-transformer';
import {validateOrReject, ValidationError} from 'class-validator';
import {BadRequestError} from '../../../errors';
import {ClassType} from 'class-transformer/ClassTransformer';

export interface ParseBodyOpts {
  /* `true` by default - setting to FALSE will prevent the body to being parsed by JSON.parse()*/
  parse?: boolean
  /* `true` will filter out all values that aren't decorated with @Expose */
  strict?: boolean
  /* will remove all `undefined` fields from dto, if set to `true` */
  stripUndefined?: boolean
  /* the class in which the body shall be tried to be parsed into */
  type?: ClassType<unknown>
  /* `true` will also call classValidator.validateOrReject. Supports only classValidator decorators. */
  validate?: boolean

}

export class BodyParser {
  public static async parseRequestBody(params: LambdaProxyHookParams) {
    const opts = this.prepareOpts(params.userOpts.body);
    const event = params.args[0];
    if (opts.parse === false || !this.validateEvent(event)) {
      return;
    }
    let body: any = this.parseJsonString(event.body);
    body = this.transformToTarget(body, opts);
    await this.validateBody(body, opts);
    event.body = body;
  }

  protected static prepareOpts(optsOrType: ParseBodyOpts | ClassType<unknown> | undefined) {
    let opts: ParseBodyOpts = {
      strict: true,
      validate: true,
      stripUndefined: false
    };
    if (!optsOrType) {
      return opts;
    }
    if (typeof optsOrType === 'function') {
      opts.type = optsOrType;
    } else {
      opts = Object.assign(opts, optsOrType);
    }
    return opts;
  }

  private static parseJsonString(body: any): Record<string, any> {
    return JSON.parse(body);
  }

  private static transformToTarget(body: Record<string, any>, opts: ParseBodyOpts): Object {
    if (!opts.type) {
      return body;
    }
    const excludeExtraneousValues = opts.strict;
    const transformed: any = plainToClass(opts.type, body, {excludeExtraneousValues});

    if (opts.stripUndefined) {
      Object.keys(transformed).forEach(key => transformed[key] === undefined ? delete transformed[key] : {});
    }

    return transformed;
  }


  private static validateEvent(event: any) {
    const supportedMethod = ['post', 'put', 'patch'].includes(event.httpMethod.toLowerCase());
    const supportedContentType = (event.headers['Content-Type'] === 'application/json');
    const hasBody = !!event.body;
    return hasBody && supportedMethod && supportedContentType;
  }

  private static async validateBody(body: Object, opts: ParseBodyOpts) {
    if (!opts.validate) {
      return;
    }

    await validateOrReject(body as Object).catch((errors: ValidationError[]) => {
      const message = errors.map((e: ValidationError) => Object.values(e.constraints as Record<string, string>)).join('.\n');
      throw new BadRequestError(message);
    });
  }
}

export const {parseRequestBody} = BodyParser;
