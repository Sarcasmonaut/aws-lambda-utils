import {LambdaProxy} from '../src/decorators/lambda';
import {APIGatewayEventRequestContext, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';

@LambdaProxy()
export class DecoratedClass {
  @LambdaProxy()
  public static async test(_event: Partial<APIGatewayProxyEvent>, _context: Partial<APIGatewayEventRequestContext>) {
    return {'body': "hallo"};
  }

  public static async fail(event: any, _context: Partial<APIGatewayEventRequestContext>): Promise<APIGatewayProxyResult> {
    const message = event.body?.message
    throw new Error(message);
  }

  @LambdaProxy({
    json: true,
    error: 400
  })
  public static async badRequest() {
    throw new Error('Hope I return 400');
  }

  @LambdaProxy({
    json: true,
  })
  public static async jsonifiedResponse(event = {
    pathParameters: {},
    queryStringParameters: {},
    body: JSON.stringify({'some': 'value'})
  }, _context = {}) {
    return JSON.parse(event.body);
  }

  static async checkJsonParse(event: Partial<APIGatewayProxyEvent>, _context: {}) {
    return event.body;
  }
}
