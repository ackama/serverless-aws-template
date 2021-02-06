import {
  CloudWatchLogsDecodedData,
  CloudWatchLogsEvent,
  CloudWatchLogsHandler
} from 'aws-lambda';
import { promisify } from 'util';
import zlib from 'zlib';
import { Notifier } from '../utils';

const gunzip = promisify(zlib.gunzip);

const decodeCloudWatchEvent = async (
  event: CloudWatchLogsEvent
): Promise<CloudWatchLogsDecodedData> => {
  const result = await gunzip(Buffer.from(event.awslogs.data, 'base64'));

  return JSON.parse(result.toString('ascii')) as CloudWatchLogsDecodedData;
};

const parseLogEvent = async (
  event: CloudWatchLogsEvent
): Promise<LogEvent[]> => {
  const decodedEvent = await decodeCloudWatchEvent(event);

  console.log(decodedEvent);

  return decodedEvent.logEvents.map(
    ({ message }) => JSON.parse(message) as LogEvent
  );
};

interface LogEvent {
  account: string;
}

const handleLog = async (event: LogEvent, notifier: Notifier) => {
  await notifier.send({ text: `hello ${event.account}!` });
};

export const handler: CloudWatchLogsHandler = async event => {
  console.log(event);

  const notifier = new Notifier();

  try {
    const events = await parseLogEvent(event);

    for (const log of events) {
      // eslint-disable-next-line no-await-in-loop
      await handleLog(log, notifier);
    }
  } catch (err: unknown) {
    console.error(err);

    await notifier.sendError(err as Error);
  }
};
