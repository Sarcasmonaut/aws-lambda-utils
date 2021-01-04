import { DecoratorFactory } from "../../../src/decorators/factory";

describe("use DecoratorFactory as ClassDecorator", () => {
  const testDecoratorOpts = { key: "val" };

  function TestDecorator(opts = {}): any {
    return DecoratorFactory("TestDecorator", {}, opts);
  }

  @TestDecorator(testDecoratorOpts)
  class TestClass {
    static staticMethod() {
      return Promise.resolve();
    }

    public async instanceMethod() {
      return Promise.resolve();
    }
  }

  it("should decorate all static methods as well by default", () => {
    const metadata = Reflect.getMetadata(
      `TestDecorator.staticMethod`,
      TestClass
    );
    expect(metadata).toEqual(testDecoratorOpts);
  });

  it("should decorate all instance methods as well by default", async () => {
    const target = TestClass.prototype;
    const metadata = Reflect.getMetadata(
      `TestDecorator.instanceMethod`,
      target
    );
    expect(metadata).toEqual(testDecoratorOpts);
  });

  test("duplicated decorators will be ignored", () => {
    const firstOpts = { first: "opts" };
    const secondOpts = { second: "opts" };

    @TestDecorator(secondOpts)
    @TestDecorator(firstOpts)
    class DoubleDecorated {
      static method() {
        return Promise.resolve();
      }
    }
    const metadata = Reflect.getMetadata(
      `TestDecorator.method`,
      DoubleDecorated
    );

    expect(metadata).toEqual(firstOpts);
  });
});
