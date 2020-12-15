import {BodyParser} from '../../../../../src/decorators/lambda-proxy/hooks/parse-request';
describe("BodyParser.validateEvent tests", () => {

  it("should return false if no event given", () => {
    // @ts-ignore
    const isValid = BodyParser.validateEvent(null);
    expect(isValid).toEqual(false);
  })

  test.each([
    [true, 'post'], [true, 'POST'], [true, 'PATCH'], [true, 'patch'], [true, 'PUT'], [true, 'put'],
    [false, 'get'], [false, 'GET'], [false, 'OPTIONS'], [false, 'DELETE'],
    [false, 'delete'], [false, 'HEAD'], [false, 'head'], [false, 'whatever'], [false, "1"], [false, ""]
  ])("should return %p if with method %p", (expected: boolean, httpMethod: string) => {
    const event = {httpMethod, headers: {'Content-Type': 'application/json'}, body: JSON.stringify({message: 'bla'})};
    // @ts-ignore
    const isValid = BodyParser.validateEvent(event);
    expect(isValid).toEqual(expected);
  });

  it("should return false if httpMethod not provided", () => {
    const event = {headers: {'Content-Type': 'application/json'}, body: JSON.stringify({message: 'bla'})};
    // @ts-ignore
    const isValid = BodyParser.validateEvent(event);
    expect(isValid).toEqual(false);
  });

  test.each([
      [false, 'application/octet-stream'], [false, 'application/ecmascript'],
      [false, 'text/html'], [false, '1'], [false, 'whatever'], [false, ''],
      [true, 'application/json']
    ]
  )(
    "should return %p if unsupported Content-Type %p", (expected: boolean, type: string) => {
      const event = {httpMethod: 'POST', headers: {'Content-Type': type}, body: JSON.stringify({message: 'test'})};
      // @ts-ignore
      const isValid = BodyParser.validateEvent(event);
      expect(isValid).toEqual(expected);
    });

  it ("should return false if Content-Type not set", () =>{
    const event = {httpMethod: 'POST', headers: {}, body: JSON.stringify({message: 'test'})};
    // @ts-ignore
    const isValid = BodyParser.validateEvent(event);
    expect(isValid).toEqual(false);
  })


});
