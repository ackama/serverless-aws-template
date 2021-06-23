import { ScheduledHandler } from 'aws-lambda';
import { Notifier } from '../utils';

export const handler: ScheduledHandler = async event => {
  console.log(event);

  const notifier = new Notifier();

  try {
    await notifier.send({ text: 'hello world!' });
  } catch (err: unknown) {
    console.error(err);

    await notifier.sendError(err as Error);
  }
};
