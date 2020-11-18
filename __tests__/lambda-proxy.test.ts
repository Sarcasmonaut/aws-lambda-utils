import {LambdaProxy} from '../src/decorators/lambda';

@LambdaProxy()
class DecoratedClass{
  @LambdaProxy()
  public static async test(){
    return { 'body': "hallo"}
  }

  public static async fail() {
    throw new Error('heo')
  }

  @LambdaProxy({
    error: 400
  })
  public static async badRequest() {
    throw new Error('Hope I have 40')
  }


}

describe('LambdaProxyDecorator tests', () =>{
  test("should inject cors", async () => {
    const res = await DecoratedClass.test()
    expect(res).toHaveProperty('headers', {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    })
  })

  test("should inject statusCode 200", async () => {
    const res = await DecoratedClass.test()
    expect(res).toHaveProperty('statusCode', 200)
  })

  test("should inject statusCode 500 on error", async () => {
    const res = await DecoratedClass.fail()
    expect(res).toHaveProperty('statusCode', 500)
    console.dir(res)
  })
  test("should inject statusCode 400 if specified", async () => {
    const res = await DecoratedClass.badRequest()
    expect(res).toHaveProperty('statusCode', 400)
    console.dir(res)
  })

})

