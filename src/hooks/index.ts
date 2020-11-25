import {HookFunction} from '../decorators/factory';

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
}

export interface HookParams {
  decoratedFunction: any,
  args: any
  result?: any
  error?: Error
  userOpts: any
}

export interface FinallyHookParams extends HookParams {
  result?: any
  error?: Error
}

export type BeforeHookParams = HookParams

export interface AfterHookParams extends HookParams {
  result: any
}

export interface ErrorHookParams extends HookParams {
  result?: any
  error: Error
}
