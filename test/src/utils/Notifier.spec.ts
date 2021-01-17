import { IncomingWebhook } from '@slack/webhook';
import { mocked } from 'ts-jest/utils';
import { Notifier } from '../../../src/utils';

jest.mock('@slack/webhook');

const fakeIncomingWebhook = mocked(IncomingWebhook, true);

describe('Notifier', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => null);
  });

  describe('constructor', () => {
    it('throws an error if SLACK_WEBHOOK_URL is not in env', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new Notifier();
      }).toThrow(/Missing SLACK_WEBHOOK_URL/u);
    });
  });

  describe('#send', () => {
    const payload: Parameters<typeof Notifier.prototype.send>[0] = {
      channel: '#my-channel',
      text: 'hello world!'
    };

    it('sends the payload to the slack webhook', async () => {
      const notifier = new Notifier('https://example.com/webhook');

      await notifier.send(payload);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(fakeIncomingWebhook.prototype.send).toHaveBeenCalledWith(payload);
    });

    describe('when sending is successful', () => {
      it('returns true', async () => {
        const notifier = new Notifier('https://example.com/webhook');

        await expect(notifier.send(payload)).resolves.toBe(true);
      });
    });

    describe('when sending is unsuccessful', () => {
      beforeEach(() => {
        fakeIncomingWebhook.prototype.send.mockRejectedValue(
          new Error('slack webhook failure')
        );
      });

      it('returns false', async () => {
        const notifier = new Notifier('https://example.com/webhook');

        await expect(notifier.send(payload)).resolves.toBe(false);
      });
    });
  });

  describe('#sendError', () => {
    it('sends a message to slack with the stack trace', async () => {
      const notifier = new Notifier('https://example.com/webhook');

      await notifier.sendError(new Error('oh noes!'), '#my-channel');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(fakeIncomingWebhook.prototype.send).toHaveBeenCalledWith({
        channel: expect.stringMatching(/^#/u) as string,
        text: expect.stringContaining('oh noes!') as string
      });
    });

    it('returns the result of #send', async () => {
      fakeIncomingWebhook.prototype.send.mockRejectedValue(
        new Error('slack webhook failure')
      );

      const notifier = new Notifier('https://example.com/webhook');

      await expect(
        notifier.sendError(new Error('oh noes!'), '#my-channel')
      ).resolves.toBe(false);
    });

    describe("when the error doesn't have a stack", () => {
      it('uses the message instead', async () => {
        const notifier = new Notifier('https://example.com/webhook');
        const error = new Error("oh noes, we don't have a stack trace!");

        delete error.stack;

        await notifier.sendError(error, '#my-channel');

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(fakeIncomingWebhook.prototype.send).toHaveBeenCalledWith({
          channel: expect.stringMatching(/^#/u) as string,
          text: expect.stringContaining(
            "oh noes, we don't have a stack trace!"
          ) as string
        });
      });
    });
  });
});
