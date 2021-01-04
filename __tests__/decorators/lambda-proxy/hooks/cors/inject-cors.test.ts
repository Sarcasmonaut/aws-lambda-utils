import { injectCors } from "../../../../../src/decorators/lambda-proxy/hooks";

describe("inject cors tests", () => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
  };

  it("should add cors headers to result.headers", () => {
    const prevHeaders = { already: "exists" };
    const expectedHeaders = { ...corsHeaders, ...prevHeaders };
    const result = { headers: prevHeaders };
    injectCors({ result } as any);
    expect(result.headers).toEqual(expectedHeaders);
  });

  it("should not override existing headers", () => {
    const headerKey = "Access-Control-Allow-Origin";
    const headerVal = "notDefault";
    const prevHeaders = { [headerKey]: headerVal };
    const result = { headers: prevHeaders };
    injectCors({ result } as any);
    expect(result.headers).toHaveProperty(headerKey, headerVal);
    expect(result.headers).toHaveProperty(
      "Access-Control-Allow-Credentials",
      corsHeaders["Access-Control-Allow-Credentials"]
    );
  });
});
