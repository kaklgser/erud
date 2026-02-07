import { edenAITextService } from './edenAITextService';

console.log('GeminiServiceWrapper: Using EdenAI for text generation');

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class GeminiServiceWrapper {
  async generateText(prompt: string): Promise<string> {
    return edenAITextService.generateTextWithRetry(prompt, {
      temperature: 0.3,
      maxTokens: 4000
    });
  }

  async chat(messages: Message[]): Promise<string> {
    return edenAITextService.chat(messages, {
      temperature: 0.3,
      maxTokens: 4000
    });
  }
}

export const geminiService = new GeminiServiceWrapper();
