import { edenAITextService } from './edenAITextService';

console.log('LinkedinService: Using EdenAI for text generation');

interface MessageForm {
  messageType: 'connection' | 'cold-outreach' | 'follow-up' | 'job-inquiry';
  recipientFirstName: string;
  recipientLastName: string;
  recipientCompany: string;
  recipientJobTitle: string;
  senderName: string;
  senderCompany: string;
  senderRole: string;
  messagePurpose: string;
  tone: 'professional' | 'casual' | 'friendly';
  personalizedContext: string;
  industry: string;
}

export const generateLinkedInMessage = async (formData: MessageForm): Promise<string[]> => {
  const getPromptForMessageType = (type: string) => {
    const baseContext = `
RECIPIENT: ${formData.recipientFirstName} ${formData.recipientLastName}, ${formData.recipientJobTitle} at ${formData.recipientCompany}
SENDER: ${formData.senderName}, ${formData.senderRole}${formData.senderCompany ? ` at ${formData.senderCompany}` : ''}
PURPOSE: ${formData.messagePurpose}
TONE: ${formData.tone}
INDUSTRY: ${formData.industry || 'Not specified'}
CONTEXT: ${formData.personalizedContext || 'No additional context provided'}`;

    switch (type) {
      case 'connection':
        return `You are an expert LinkedIn networking specialist.

${baseContext}

Write 3 different personalized LinkedIn connection request messages.

REQUIREMENTS:
- Under 200 characters each
- Professional and ${formData.tone} tone
- Include one specific detail about them or their company
- End with clear value proposition
- Avoid generic templates
- Make each version distinctly different

CRITICAL: Each message must be under 200 characters (LinkedIn's connection request limit).

Respond with exactly 3 messages, each on a separate line, numbered 1-3.`;

      case 'cold-outreach':
        return `Act as a LinkedIn sales messaging expert.

${baseContext}

Create 3 different cold outreach messages.

REQUIREMENTS:
- Maximum 300 characters each
- Personalize with recipient's background
- Include one clear call-to-action
- ${formData.tone} but conversational tone
- Provide value upfront
- Make each version have different approach

Respond with exactly 3 messages, each on a separate line, numbered 1-3.`;

      case 'follow-up':
        return `You are a professional relationship manager.

${baseContext}

Write 3 different LinkedIn follow-up messages.

REQUIREMENTS:
- Reference previous interaction context
- Provide new value or update
- Keep under 250 characters each
- Include specific next step
- ${formData.tone} tone
- Make each version unique

Respond with exactly 3 messages, each on a separate line, numbered 1-3.`;

      case 'job-inquiry':
        return `Act as a career coach and job search expert.

${baseContext}

Generate 3 different job inquiry LinkedIn messages.

REQUIREMENTS:
- Express genuine interest in opportunities
- Highlight relevant skills/experience
- Professional and ${formData.tone} tone
- Under 280 characters each
- Include clear call-to-action
- Make each version have different angle

Respond with exactly 3 messages, each on a separate line, numbered 1-3.`;

      default:
        return `You are a LinkedIn messaging specialist.

${baseContext}

Create 3 different professional LinkedIn messages for the specified purpose.

REQUIREMENTS:
- ${formData.tone} tone
- Under 250 characters each
- Personalized and specific
- Include clear call-to-action
- Make each version unique

Respond with exactly 3 messages, each on a separate line, numbered 1-3.`;
    }
  };

  const prompt = getPromptForMessageType(formData.messageType);

  try {
    const result = await edenAITextService.generateTextWithRetry(prompt, {
      temperature: 0.7,
      maxTokens: 2000
    });

    if (!result) {
      throw new Error('No response content from EdenAI');
    }

    // Parse the numbered messages
    const messages = result
      .split('\n')
      .filter((line: string) => line.trim().match(/^\d+\./))
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((msg: string) => msg.length > 0);

    if (messages.length === 0) {
      // Fallback: split by numbers or return the whole response
      const fallbackMessages = result
        .split(/\d+\./)
        .filter((msg: string) => msg.trim().length > 10)
        .map((msg: string) => msg.trim())
        .slice(0, 3);

      return fallbackMessages.length > 0 ? fallbackMessages : [result.trim()];
    }

    return messages.slice(0, 3); // Ensure we return exactly 3 messages
  } catch (error) {
    console.error('Error calling EdenAI:', error);
    throw new Error('Failed to generate LinkedIn messages. Please try again.');
  }
};
