import {DecoratedClass} from './decorated-class';
import {BadRequestError} from '../src/errors';

describe('LambdaProxyDecorator tests', async () => {
  test("should inject cors", async () => {
    const res = await DecoratedClass.test({}, {});
    expect(res).toHaveProperty('headers', {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "counter": 0
    });
  });

  test("should inject statusCode 200", async () => {
    const res = await DecoratedClass.test({}, {});
    console.log(JSON.stringify(res))
    expect(res).toHaveProperty('statusCode', 200);
  });

  test("should inject statusCode 500 on error", async () => {
    const expectedMessage = 'error message';
    const res = await DecoratedClass.fail({
      body: JSON.stringify({ message: expectedMessage }),
      headers: {
        'Content-Type': 'application/json'
      },
      httpMethod: 'post'
    }, {});
    expect(res).toHaveProperty('statusCode', 500);
    expect(res).toHaveProperty('body')
    expect(JSON.parse(res.body)).toHaveProperty('message', expectedMessage)
    console.dir(res);
  });
  test("should inject statusCode 400 if specified", async () => {
    const res = await DecoratedClass.badRequest();
    expect(res).toHaveProperty('statusCode', 400);
    console.dir(res);
  });

  test("should automatically JSON.stringify response if not already done", async () => {
    const obj: Record<string, any> = {'my': 'obj'};
    const res = await DecoratedClass.jsonifiedResponse({
      body: JSON.stringify(obj),
      pathParameters: {},
      queryStringParameters: {}
    }, {});
    expect(res).toHaveProperty('body', JSON.stringify(obj));
  });

  test("should automatically parse json body if header is application/json", async () => {
    const obj: Record<string, any> = {'my': 'obj'};
    const res = await DecoratedClass.checkJsonParse({
      body: JSON.stringify(obj),
      httpMethod: 'POST',
      headers: {'Content-Type': 'application/json'},
      pathParameters: {},
      queryStringParameters: {}
    }, {});
    expect(res).toHaveProperty('body', JSON.stringify(obj));
  });

  test("should transform into provided class", async () => {
    const obj: Record<string, any> = {'name': 'patrik', 'notExposed': 'heo'};
    const res = await DecoratedClass.parseClass({
      body: JSON.stringify(obj),
      httpMethod: 'POST',
      headers: {'Content-Type': 'application/json'},
      pathParameters: {},
      queryStringParameters: {}
    })
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty('name', obj.name)
    expect(body).not.toHaveProperty('notExposed')
  })

  test("should fail with statusCode 400 on validation error", async () => {
    const obj: Record<string, any> = { minFive: 3};
    const res = await DecoratedClass.parseClass({
      body: JSON.stringify(obj),
      httpMethod: 'POST',
      headers: {'Content-Type': 'application/json'},
      pathParameters: {},
      queryStringParameters: {}
    })
    expect(res.statusCode).toEqual(400)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty('error', new BadRequestError().name)

  })
});

