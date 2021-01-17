import {
  CloudWatchLogsDecodedData,
  CloudWatchLogsEvent,
  Context
} from 'aws-lambda';
import { CloudWatchLogsLogEvent } from 'aws-lambda/trigger/cloudwatch-logs';
import { mocked } from 'ts-jest/utils';
import { gzipSync } from 'zlib';
import { handler } from '../../../src/cloudwatch-lambda';
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

const buildDecodedData = (
  logEvents: CloudWatchLogsLogEvent[]
): CloudWatchLogsDecodedData => ({
  messageType: 'DATA_MESSAGE',
  owner: '017242624401',
  logGroup: 'my-log-group',
  logStream: 'my-log-stream',
  subscriptionFilters: ['my-subscription-filter'],
  logEvents
});

const buildCloudWatchEvent = (
  logEvents: CloudWatchLogsLogEvent[]
): CloudWatchLogsEvent => ({
  awslogs: {
    data: gzipSync(
      Buffer.from(JSON.stringify(buildDecodedData(logEvents)))
    ).toString('base64')
  }
});

describe('handler', () => {
  describe('when there are events', () => {
    it('sends to the channel set by SLACK_CHANNEL', async () => {
      process.env.SLACK_CHANNEL = '#my-channel';

      const event = buildCloudWatchEvent([
        {
          id: '1234567890',
          timestamp: 1610908777758,
          message: JSON.stringify({ account: '1234567890' })
        }
      ]);

      await handler(event, fakeContext, console.log);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockNotifier.prototype.send).toHaveBeenCalledWith({
        channel: '#my-channel',
        text: expect.any(String) as string
      });
    });

    it('sends a notification message for each event', async () => {
      const accounts = ['1234567890', '0987654321'];
      const event = buildCloudWatchEvent(
        accounts.map((account, index) => ({
          id: '1234567890',
          timestamp: 1610908777758 + index * 100,
          message: JSON.stringify({ account })
        }))
      );

      await handler(event, fakeContext, console.log);

      accounts.forEach(account => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockNotifier.prototype.send).toHaveBeenCalledWith({
          channel: expect.any(String) as string,
          text: `hello ${account}!`
        });
      });
    });
  });

  describe('when there are no events', () => {
    it('sends nothing', async () => {
      const event = buildCloudWatchEvent([
        { id: '1234567890', timestamp: 1610908777758, message: 'hello world!' }
      ]);

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

      const event = buildCloudWatchEvent([
        {
          id: '1234567890',
          timestamp: 1610908777758,
          message: JSON.stringify({ account: '1234567890' })
        }
      ]);

      await handler(event, fakeContext, console.log);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockNotifier.prototype.sendError).toHaveBeenCalledWith(
        error,
        '#my-channel'
      );
    });
  });
});
