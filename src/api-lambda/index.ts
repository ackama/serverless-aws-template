import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { Notifier } from '../utils';

interface PostBody {
  message: string;
}

const getMessage = (body: string): string | APIGatewayProxyResult => {
  try {
    const { message } = JSON.parse(body) as PostBody;

    if (message) {
      return message;
    }

    return { statusCode: 400, body: 'a value for "message" is required' };
  } catch (error) {
    return { statusCode: 400, body: 'invalid JSON' };
  }
};

export const handler: APIGatewayProxyHandler = async event => {
  console.log(event);

  const notifier = new Notifier();

  try {
    const message = getMessage(event.body ?? '');

    if (typeof message === 'object') {
      return message;
    }

    await notifier.send({ text: message });

    return { statusCode: 200, body: 'message sent' };
  } catch (err: unknown) {
    console.error(err);

    await notifier.sendError(err as Error);

    return { statusCode: 500, body: 'oh noes!' };
  }
};
