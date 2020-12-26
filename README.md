# aws-lambda-utils

An opinionated, decorated-based approach to reduce code required to create AWS Lambda handler functions.

## Available Decorators
### LambdaProxy

A decorator that focuses to process [AWS Lambda handler with ProxyIntegration](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html).
It will try to make sure to return a valid response that APIGateway can cope with, i.e.:
```typescript
let res: {
   statusCode: number,
   headers: Record<string,string>
   body?: string
};
```

Lambda Proxy currently supports the following features:

1. cors header injection
1. body parsing
1. response transformation
    1. statusCode
    1. body
1. error handling
1. user extraction

#### cors header injection

Will inject the following cors headers with the `event.headers` ultimatively returned by the decorated handler:
```
{ 
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true
}
```

Usage: 
```
  @LambdaProxy()
  class TestClass {
    public static injectCors(_event: any, _context: any) {
      return Promise.resolve();
    }
  }
  
  console.dir(TestClass.injectCors().headers)
  # >  {
  # >    'Access-Control-Allow-Origin': '*',
  # >    'Access-Control-Allow-Credentials': true
  # >  }
```

TBD: 
- make injection optional
- allow custom header injection

#### body parsing

With the help of the `body` attribute in the [LambdaProxyOpts](src/decorators/lambda-proxy/index.ts),
we can validate and transform the value provided in `event.body`:
```typescript

```

In order to enable comfortable parsing & transformation of json-based input data, 
we are using [class-transformer](https://github.com/typestack/class-transformer) and [class-validator](https://github.com/typestack/class-validator).

