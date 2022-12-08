import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { handler } from '../../../src/api-lambda';
import { Notifier } from '../../../src/utils';

jest.mock('../../../src/utils/Notifier');

const mockNotifier = jest.mocked(Notifier);

// a fake context to get us through the day
const fakeContext = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'MyFunction',
  functionVersion: '1',
  invokedFunctionArn: 'string',
  memoryLimitInMB: '128mb',
  awsRequestId: '12345',
  logGroupName: 'Lambda/MyFunction',
  logStreamName: '1-2-3',
  identity: {
    cognitoIdentityId: '1',
    cognitoIdentityPoolId: '1'
  }
} as Context;

const buildApiGatewayEvent = (message: string): APIGatewayProxyEvent => {
  return {
    body: JSON.stringify({ message }),
    headers: {}
  } as APIGatewayProxyEvent;
};

describe('handler', () => {
  describe('when the body has a message property', () => {
    describe('when the message property is not empty', () => {
      it('sends a message to Slack', async () => {
        const message = 'hello world!';
        const event = buildApiGatewayEvent(message);

        await handler(event, fakeContext, console.log);

        expect(mockNotifier.prototype.send).toHaveBeenCalledWith({
          text: message
        });
      });
    });

    describe('when the message property is empty', () => {
      const event = buildApiGatewayEvent('');

      it('returns Bad Request', async () => {
        await expect(
          handler(event, fakeContext, console.log)
        ).resolves.toHaveProperty('statusCode', 400);
      });

      it('does not send any messages', async () => {
        await handler(event, fakeContext, console.log);

        expect(mockNotifier.prototype.send).not.toHaveBeenCalled();
      });
    });
  });

  describe('when the body is not valid json', () => {
    const event = buildApiGatewayEvent('');

    event.body = '';

    it('returns Bad Request', async () => {
      await expect(
        handler(event, fakeContext, console.log)
      ).resolves.toHaveProperty('statusCode', 400);
    });

    it('does not send any messages', async () => {
      await handler(event, fakeContext, console.log);

      expect(mockNotifier.prototype.send).not.toHaveBeenCalled();
    });
  });

  describe('when there is an error', () => {
    const error = new Error('oh noes!');

    beforeEach(() => {
      mockNotifier.prototype.send.mockRejectedValue(error);
    });

    it('sends the error to Slack', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => null);

      const event = buildApiGatewayEvent('my message');

      await handler(event, fakeContext, console.log);

      expect(mockNotifier.prototype.sendError).toHaveBeenCalledWith(error);
    });

    it('returns a 500', async () => {
      const event = buildApiGatewayEvent('my message');

      await expect(
        handler(event, fakeContext, console.log)
      ).resolves.toHaveProperty('statusCode', 500);
    });
  });
});
