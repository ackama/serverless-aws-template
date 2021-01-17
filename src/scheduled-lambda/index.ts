import { ScheduledHandler } from 'aws-lambda';
import { Notifier } from '../utils';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SLACK_CHANNEL: string;
    }
  }
}

export const handler: ScheduledHandler = async event => {
  console.log(event);

  const notifier = new Notifier();

  try {
    await notifier.send({
      channel: process.env.SLACK_CHANNEL,
      text: 'hello world!'
    });
  } catch (err: unknown) {
    console.error(err);

    await notifier.sendError(err as Error, process.env.SLACK_CHANNEL);
  }
};
