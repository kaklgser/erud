// Test setup file for mocks and global configurations
import { vi } from 'vitest';

// Mock the semantic matching service to prevent ONNX runtime errors
vi.mock('../services/semanticMatchingService', () => ({
  SemanticMatchingService: {
    generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5]),
    semanticMatch: vi.fn().mockResolvedValue(0.8),
    hybridMatch: vi.fn().mockResolvedValue({
      literalScore: 0.7,
      semanticScore: 0.8,
      combinedScore: 0.75,
      confidence: 0.9
    }),
    analyzeKeywordContext: vi.fn().mockResolvedValue({
      keywordAnalysis: [],
      averageRelevance: 0.8,
      semanticAlternatives: []
    }),
    calculateAverageRelevance: vi.fn().mockResolvedValue(0.8),
    findSemanticAlternatives: vi.fn().mockResolvedValue([]),
    cosineSimilarity: vi.fn().mockReturnValue(0.8),
    getCacheSize: vi.fn().mockReturnValue(0),
    clearCache: vi.fn()
  }
}));

// Mock EdenAI service to prevent API call failures in tests
vi.mock('../services/edenAITextService', () => ({
  default: {
    generateTextWithRetry: vi.fn().mockResolvedValue('Mocked AI response'),
    generateText: vi.fn().mockResolvedValue('Mocked AI response'),
    parseJSONResponse: vi.fn().mockReturnValue({ mocked: true })
  },
  edenAITextService: {
    generateTextWithRetry: vi.fn().mockResolvedValue('Mocked AI response'),
    generateText: vi.fn().mockResolvedValue('Mocked AI response'),
    parseJSONResponse: vi.fn().mockReturnValue({ mocked: true })
  },
  generateTextWithRetry: vi.fn().mockResolvedValue('Mocked AI response'),
  generateText: vi.fn().mockResolvedValue('Mocked AI response'),
  parseJSONResponse: vi.fn().mockReturnValue({ mocked: true })
}));

// Mock resume parser service to prevent API failures
vi.mock('../services/edenResumeParserService', () => ({
  parseResumeWithEdenAI: vi.fn().mockResolvedValue({
    success: true,
    data: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '123-456-7890',
      summary: 'Test summary',
      workExperience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: []
    }
  })
}));