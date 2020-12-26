import { BodyParser } from "../../../../../src/decorators/lambda-proxy/hooks/parse-request";
import { BadRequestError } from "../../../../../src/errors";

describe("BodyParser.parseJsonString tests", () => {
  test.each(["notajsonstring", undefined])(
    "[%p] should raise BadRequestError if invalid body was provided ",
    (invalidBody: any) => {
      // @ts-ignore
      expect(() => BodyParser.parseJsonString(invalidBody)).toThrow(
        new BadRequestError(
          "Malformed Body. Expected stringified json content."
        )
      );
    }
  );

  it("should return parsed object if stringified json was provided", () => {
    const expected = { message: "test" };
    // @ts-ignore
    const res = BodyParser.parseJsonString(JSON.stringify(expected));
    expect(res).toEqual(expected);
  });
});
