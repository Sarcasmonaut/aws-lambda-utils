import 'reflect-metadata';

export interface DecoratorFactoryOpts {
  before?: BeforeHook[]
  onSuccess?: AfterHook[]
  onError?: ErrorHook[]
  finally?: FinallyHook[]
}

export type HookFunction = (params: HookParams) => void | Promise<void>

export interface AfterHook extends HookFunction {
  (params: AfterHookParams): void | Promise<void>
}

export interface ErrorHook extends HookFunction {
  (params: ErrorHookParams): void | Promise<void>
}

export interface FinallyHook extends HookFunction {
  (params: FinallyHookParams): void | Promise<void>
}

export interface BeforeHook extends HookFunction {
  (params: BeforeHookParams): void | Promise<void>

  // (params: BeforeHookParams):
}

export interface HookParams {
  decoratedFunction: any,
  args: any
  result?: any
  error?: Error
}

export interface FinallyHookParams extends HookParams {
  result?: any
  error?: Error
}

export interface BeforeHookParams extends HookParams {
}

export interface AfterHookParams extends HookParams {
  result: any
}

export interface ErrorHookParams extends HookParams {
  result?: any
  error: Error
}

type DecoratorStep = keyof DecoratorFactoryOpts | 'before' | 'onSuccess' | 'onError' | 'finally'
export const DecoratorFactory = (name: string, opts: DecoratorFactoryOpts): any => {

  function generateDescriptor(descriptor: PropertyDescriptor): PropertyDescriptor {
    let originalMethod: Function = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      async function executeStep(stepName: DecoratorStep, params: HookParams) {
        let hooks: HookFunction[] = opts[stepName] || [];
        for (const hook of hooks) {
          await hook(params);
        }
      }

      let result: any;
      let hookParams: HookParams = {decoratedFunction: originalMethod, args: args};
      try {
        await executeStep('before', hookParams);
        result = await Promise.resolve(originalMethod.apply(this, args));
        (hookParams as AfterHookParams).result = result;
        await executeStep('onSuccess', hookParams);
      } catch (error) {
        (hookParams as ErrorHookParams).error = error;
        await executeStep('onError', hookParams);
      } finally {
        await executeStep('finally', hookParams);
      }
      return (hookParams as AfterHookParams).result;
    };
    return descriptor;
  }

  function decorateProperties(
    instanceKeys: PropertyKey[],
    descriptorTarget: any,
    _propertyKey: string | symbol | undefined
  ) {
    for (const propertyName of instanceKeys.filter(
      (prop) => prop !== "constructor"
    )) {
      if (Reflect.getMetadata(`${name}.${String(propertyName)}`, descriptorTarget)) continue;
      const desc = Object.getOwnPropertyDescriptor(
        descriptorTarget,
        propertyName
      );
      if (!desc || !(desc.value instanceof Function)) continue;
      Object.defineProperty(
        descriptorTarget,
        propertyName,
        decorateMethod(desc)
      );
    }
  }

  function decorateStaticProperties(
    target: any,
    propertyKey: string | symbol | undefined
  ) {
    const staticKeys = Object.getOwnPropertyNames(target).filter(
      (el) => typeof target[el] === "function"
    );
    decorateProperties(staticKeys, target, propertyKey);
  }

  function decorateInstanceProperties(
    target: any,
    propertyKey: string | symbol | undefined
  ) {
    const instanceKeys = Reflect.ownKeys(target.prototype);
    decorateProperties(instanceKeys, target.prototype, propertyKey);
  }

  function decorateClass(
    target: any,
    propertyKey: string | symbol | undefined
  ) {
    decorateInstanceProperties(target, propertyKey);
    decorateStaticProperties(target, propertyKey);
  }

  function decorateMethod(descriptor: PropertyDescriptor) {
    return generateDescriptor(descriptor);
  }

  return function (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) {

    let decoratedOpts;
    if (descriptor && propertyKey) {
      decoratedOpts = Reflect.getMetadata(`${name}.${String(propertyKey)}`, target);
      if (!decoratedOpts) {
        Reflect.defineMetadata(`${name}.${String(propertyKey)}`, opts, target);
        decorateMethod(descriptor);
      }
      return;
    }

    decoratedOpts = Reflect.getMetadata(name, target);
    if (decoratedOpts) {
      return;
    } else {
      Reflect.defineMetadata(name, opts, target);
      decorateClass(target, propertyKey);
    }

  };
};
