import {ClassType} from "class-transformer/ClassTransformer";
export {BodyParser, ParseBodyOpts} from "./parse-request";
export {injectCors} from "./cors";
export {extractUser} from "./extract-user";
export {ResponseTransformer, TransformResultOpts} from "./transform-result";


export interface TransformationOpts {
  /* `true` will filter out all values that aren't decorated with @Expose */
  strict?: boolean;
  /* will remove all `undefined` fields from dto, if set to `true` */
  stripUndefined?: boolean;
  /* the class in which the body shall be tried to be parsed into */
  type?: ClassType<unknown>;
}
