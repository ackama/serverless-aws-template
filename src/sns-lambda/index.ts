import { SNSHandler, SNSMessage } from 'aws-lambda';
import { Notifier } from '../utils';

const handleSns = async (sns: SNSMessage, notifier: Notifier) => {
  await notifier.send({ text: buildNotificationMessage(sns) });
};

const buildNotificationMessage = (sns: SNSMessage): string =>
  [
    'You have a new notification:',
    sns.Timestamp,
    '',
    `*${sns.Subject ?? ''}*`,
    '',
    sns.Message
  ].join('\n');

export const handler: SNSHandler = async event => {
  console.log(event);

  const notifier = new Notifier();

  try {
    for (const { Sns: sns } of event.Records) {
      // eslint-disable-next-line no-await-in-loop
      await handleSns(sns, notifier);
    }
  } catch (err: unknown) {
    console.error(err);

    await notifier.sendError(err as Error);
  }
};
