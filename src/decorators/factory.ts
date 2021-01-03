import "reflect-metadata";
import * as _ from "lodash";
import {
  AfterHook,
  AfterHookParams,
  BeforeHook,
  ErrorHook,
  ErrorHookParams,
  FinallyHook,
  HookParams,
} from "../hooks";

export interface DecoratorHooks {
  before?: BeforeHook[];
  onSuccess?: AfterHook[];
  onError?: ErrorHook[];
  finally?: FinallyHook[];
}

export type HookFunction = (params: HookParams) => void | Promise<void>;

type DecoratorStep =
  | keyof DecoratorHooks
  | "before"
  | "onSuccess"
  | "onError"
  | "finally";
export const DecoratorFactory = (
  name: string,
  hooks: DecoratorHooks,
  userOpts: any = {}
): any => {
  function generateDescriptor(
    descriptor: PropertyDescriptor,
    descriptorTarget: any,
    targetKey: string
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      async function executeStep(stepName: DecoratorStep, params: HookParams) {
        const stepHooks: HookFunction[] = hooks[stepName] || [];
        for (const hook of stepHooks) {
          await hook(params);
        }
      }

      let result: any;
      const opts = Reflect.getMetadata(
        `${name}.${String(targetKey)}`,
        descriptorTarget
      );
      const hookParams: HookParams = {
        decoratedFunction: originalMethod,
        args: _.cloneDeep(args),
        userOpts: opts,
      };
      try {
        await executeStep("before", hookParams);
        result = await Promise.resolve(
          originalMethod.apply(this, hookParams.args)
        );
        (hookParams as AfterHookParams).result = result;
        await executeStep("onSuccess", hookParams);
      } catch (error) {
        (hookParams as ErrorHookParams).error = error;
        if (!hooks.onError || hooks.onError.length <= 0) {
          throw error;
        }
        await executeStep("onError", hookParams);
      } finally {
        await executeStep("finally", hookParams);
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
      const metadataKey = `${name}.${String(propertyName)}`;
      const metadata = Reflect.getMetadata(metadataKey, descriptorTarget);
      if (metadata) {
        Reflect.defineMetadata(
          metadataKey,
          { ...userOpts, ...metadata },
          descriptorTarget
        );
        continue;
      }
      Reflect.defineMetadata(metadataKey, userOpts, descriptorTarget);
      const desc = Object.getOwnPropertyDescriptor(
        descriptorTarget,
        propertyName
      );
      if (!desc || !(desc.value instanceof Function)) continue;
      Object.defineProperty(
        descriptorTarget,
        propertyName,
        decorateMethod(desc, descriptorTarget, propertyName as string)
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

  function decorateMethod(
    descriptor: PropertyDescriptor,
    descriptorTarget: any,
    targetKey: any
  ) {
    return generateDescriptor(descriptor, descriptorTarget, targetKey);
  }

  return function (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) {
    let decoratedOpts;
    if (descriptor && propertyKey) {
      decoratedOpts = Reflect.getMetadata(
        `${name}.${String(propertyKey)}`,
        target
      );
      if (!decoratedOpts) {
        Reflect.defineMetadata(
          `${name}.${String(propertyKey)}`,
          userOpts,
          target
        );
        decorateMethod(descriptor, target, propertyKey);
      }
      return;
    }

    decoratedOpts = Reflect.getMetadata(name, target);
    if (decoratedOpts) {
      return;
    } else {
      Reflect.defineMetadata(name, userOpts, target);
      decorateClass(target, propertyKey);
    }
  };
};
