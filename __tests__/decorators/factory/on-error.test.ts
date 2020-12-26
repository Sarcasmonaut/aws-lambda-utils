import { DecoratorFactory } from "../../../src/decorators/factory";

describe("onError hook tests", () => {
  const errorHook = jest.fn();
  function ErrorHookDecorator(): any {
    return DecoratorFactory("ErrorHookDecorator", { onError: [errorHook] });
  }
  function NoErrorHookDecorator(): any {
    return DecoratorFactory("ErrorHookDecorator", {});
  }
  class TestClass {
    @ErrorHookDecorator()
    static withErrorHook(raise: Error = new Error()) {
      throw raise;
    }
    @NoErrorHookDecorator()
    static withoutErrorHook(raise: Error = new Error()) {
      throw raise;
    }
  }

  beforeEach(() => {
    errorHook.mockClear();
  });

  it("should call onError hook if provided", async () => {
    const error = new Error("should be forwarded to hook");
    await TestClass.withErrorHook(error);
    expect(errorHook).toHaveBeenCalledTimes(1);
  });

  it("should simply raise original Error if no hook provided", async () => {
    const error = new Error("should be forwarded to hook");
    await expect(TestClass.withoutErrorHook(error)).rejects.toEqual(error);
    expect(errorHook).not.toHaveBeenCalled();
  });
});
