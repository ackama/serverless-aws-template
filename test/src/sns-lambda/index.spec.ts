import { Context, SNSEvent, SNSMessage } from 'aws-lambda';
import { mocked } from 'ts-jest/utils';
import { handler } from '../../../src/sns-lambda';
import { Notifier } from '../../../src/utils';

jest.mock('../../../src/utils/Notifier');

const mockNotifier = mocked(Notifier, true);

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

const buildSNSMessage = (message: Partial<SNSMessage>): SNSMessage => ({
  Message: 'Hello World!',
  Subject: 'My Message!',
  MessageAttributes: {},
  MessageId: 'message-0',
  Signature: 'message-0',
  SignatureVersion: '1',
  SigningCertUrl: 'https://signing-cert-url.com',
  Timestamp: new Date().toISOString(),
  TopicArn: 'arn::',
  Type: 'Notification',
  UnsubscribeUrl: 'https://unsubscribe.com',
  ...message
});

const buildSNSEvent = (messages: Array<Partial<SNSMessage>>): SNSEvent => ({
  Records: messages.map((message, index) => ({
    Sns: buildSNSMessage({ MessageId: `message-${index}`, ...message }),
    EventVersion: 'string',
    EventSubscriptionArn: 'string',
    EventSource: 'string'
  }))
});

describe('handler', () => {
  describe('when there are events', () => {
    it('sends to the channel set by SLACK_CHANNEL', async () => {
      process.env.SLACK_CHANNEL = '#my-channel';

      const event = buildSNSEvent([{ Message: 'hello world' }]);

      await handler(event, fakeContext, console.log);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockNotifier.prototype.send).toHaveBeenCalledWith({
        channel: '#my-channel',
        text: expect.any(String) as string
      });
    });

    it('sends a notification message for each record', async () => {
      const messages = ['hello world', 'hello sunshine'];
      const event = buildSNSEvent(messages.map(m => ({ Message: m })));

      await handler(event, fakeContext, console.log);

      messages.forEach(message => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockNotifier.prototype.send).toHaveBeenCalledWith({
          channel: expect.any(String) as string,
          text: expect.stringContaining(message) as string
        });
      });
    });
  });

  describe('when there are no events', () => {
    it('sends nothing', async () => {
      const event = buildSNSEvent([]);

      await handler(event, fakeContext, console.log);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockNotifier.prototype.send).not.toHaveBeenCalled();
    });
  });

  describe('when there is an error', () => {
    const error = new Error('oh noes!');

    beforeEach(() => {
      mockNotifier.prototype.send.mockRejectedValue(error);
      process.env.SLACK_CHANNEL = '#my-channel';
    });

    it('sends the error to the channel set by SLACK_CHANNEL', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => null);

      const event = buildSNSEvent([{ Message: 'hello world' }]);

      await handler(event, fakeContext, console.log);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockNotifier.prototype.sendError).toHaveBeenCalledWith(
        error,
        '#my-channel'
      );
    });
  });
});
