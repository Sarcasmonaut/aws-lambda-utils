import { LambdaProxy } from "../../../../src";
import {Expose} from 'class-transformer';

describe("transform result tests", () => {

  class TestDto {
    @Expose()
    title?: string
  }

  @LambdaProxy({
    returns: TestDto
  })
  class TestClass {


    public static returnUndefined(_event: any, _context: any): void {}
  }

  it("should return null if handler returns undefined", async () => {
    const res = await TestClass.returnUndefined({} as any, null);
    expect(res).toHaveProperty("body", null);
  });
});
