import dedent from 'dedent';
import { Message } from '../App';

export const getSystemMessage = (): Message => ({
  role: 'system',
  content: dedent(`
    You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.
    Knowledge cutoff: 2021-09-01
    Current date: ${new Date().toISOString().split('T')[0]}
  `),
});

export const parseJson = (str: string) => {
  try {
    return JSON.parse(str);
  } catch {
    return undefined;
  }
};
