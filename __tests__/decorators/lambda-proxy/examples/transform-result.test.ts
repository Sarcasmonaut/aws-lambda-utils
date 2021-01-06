import { LambdaProxy } from "../../../../src";
import { Expose } from "class-transformer";

describe("transform result tests", () => {
  class TestDto {
    @Expose()
    title?: string;
  }

  @LambdaProxy({
    returns: TestDto,
  })
  class TestClass {
    public static returnUndefined(_event: any, _context: any): void {
      return undefined;
    }
    public static returnNull(_event: any, _context: any): null {
      return null;
    }
  }

  it("should return undefined if handler returns undefined", async () => {
    const res = await TestClass.returnUndefined({} as any, null);
    expect(res).toHaveProperty("body", undefined);
  });
  it("should return undefined if handler returns undefined", async () => {
    const res = await TestClass.returnNull({} as any, null);
    expect(res).toHaveProperty("body", null);
  });
});
