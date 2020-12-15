import {BodyParser} from '../../../../../src/decorators/lambda-proxy/hooks/parse-request';

describe("BodyParser.validateEvent tests", () => {

  test.each([
      'get', 'GET', 'OPTIONS', 'DELETE', 'delete', 'HEAD', 'head', 'whatever', "1", "2.3"
    ], "should return false if with unsupported method %p",
    (httpMethod: string) => {
      const event = {httpMethod};
      // @ts-ignore
      const isValid = BodyParser.validateEvent(event);
      expect(isValid).toEqual(false);
    }
  );


});
