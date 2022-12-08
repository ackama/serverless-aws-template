import { Context, ScheduledEvent } from 'aws-lambda';
import { mocked } from 'ts-jest/utils';
import { handler } from '../../../src/scheduled-lambda';
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

const buildScheduledEvent = (): ScheduledEvent => ({
  'version': '0',
  'id': '3324ece6-d736-aa3a-84b1-178ae1f762bb',
  'detail-type': 'Scheduled Event',
  'source': 'aws.events',
  'account': '467744966817',
  'time': '2021-01-14T17:00:00Z',
  'region': 'ap-southeast-2',
  'resources': [
    'arn:aws:events:ap-southeast-2:467744966817:rule/serverless-aws-tem-ScheduledDashlambdaEvent-114OLMF1CU753'
  ],
  'detail': {}
});

describe('handler', () => {
  describe('when there is an event', () => {
    it('sends a message to Slack', async () => {
      const event = buildScheduledEvent();

      await handler(event, fakeContext, console.log);

      expect(mockNotifier.prototype.send).toHaveBeenCalledWith({
        text: expect.any(String) as string
      });
    });
  });

  describe('when there is an error', () => {
    const error = new Error('oh noes!');

    beforeEach(() => {
      mockNotifier.prototype.send.mockRejectedValue(error);
    });

    it('sends the error to Slack', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => null);

      const event = buildScheduledEvent();

      await handler(event, fakeContext, console.log);

      expect(mockNotifier.prototype.sendError).toHaveBeenCalledWith(error);
    });
  });
});
