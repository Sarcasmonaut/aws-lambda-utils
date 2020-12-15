import {BodyParser} from '../../../../../src/decorators/lambda-proxy/hooks/parse-request';
import * as classValidator from 'class-validator';
import {IsNumber} from 'class-validator';
import {BadRequestError} from '../../../../../src/errors';

describe("BodyParser.validateBody test", () => {
  class TestClass {
    @IsNumber()
    isAnyInstead?: any;
  }

  test.each([false, null, undefined, '', 0])
  ("[ %p ] should return undefined if opts.validate is falsey", (async (validate: any) => {
    const opts = {validate};
    const dto = new TestClass();
    dto.isAnyInstead = 'sorry';
    // @ts-ignore
    const res = await BodyParser.validateBody(dto, opts);
    expect(res).toBeUndefined();
  }));

  it("should call validateOrReject if opts.validate is truthy", async () => {
    const mockValidator = jest.spyOn(classValidator, 'validateOrReject');
    mockValidator.mockImplementationOnce(() => Promise.resolve());
    const opts = {validate: true};
    const body =  new TestClass();

    // @ts-ignore
    await BodyParser.validateBody(body, opts);

    expect(mockValidator).toHaveBeenCalledTimes(1);
    expect(mockValidator).toHaveBeenCalledWith(body);
    mockValidator.mockClear();
  });

  test.each([["not", 1], ["indeed", "noNumber"], ["indeed", {"noNumber": 2}], ['indeed', true]])(
    "should %p fail if field with @IsNumber has value %p", async (shouldFailString: string, value: any) => {
      const opts = {validate: true};
      const dto = new TestClass();
      dto.isAnyInstead = value;

      // @ts-ignore
      const expectation = expect(() => BodyParser.validateBody(dto, opts));
      if (shouldFailString === 'not') {
        await expectation.resolves;

      } else {
        await expectation.rejects.toEqual(new BadRequestError('isAnyInstead must be a number conforming to the specified constraints'));

      }
    });


});
