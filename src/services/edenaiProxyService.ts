// src/services/edenaiProxyService.ts
// Re-exports from unified aiProxyService for backward compatibility

import { edenai } from './aiProxyService';

export const extractTextWithOCR = edenai.extractText.bind(edenai);
export const chatWithAI = edenai.chat.bind(edenai);
export const summarizeText = edenai.summarize.bind(edenai);

export const edenaiProxyService = {
  extractTextWithOCR,
  chatWithAI,
  summarizeText,
};

export default edenaiProxyService;
