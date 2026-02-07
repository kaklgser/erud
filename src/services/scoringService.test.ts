// src/services/scoringService.test.ts
import { describe, it, expect } from 'vitest';
import { applyScoreFloor } from './scoringService';
import { ResumeData } from '../types/resume';

// Helper to create base resume data with all sections populated
const createBaseResume = (): ResumeData => ({
  name: 'John Doe',
  phone: '1234567890',
  email: 'john@example.com',
  linkedin: 'linkedin.com/in/johndoe',
  github: 'github.com/johndoe',
  summary: 'Experienced developer.',
  education: [{ degree: 'B.Tech', school: 'XYZ University', year: '2020' }],
  workExperience: [{ role: 'Dev', company: 'ABC', year: '2021', bullets: ['Did stuff'] }],
  projects: [{ title: 'Proj', bullets: ['Did proj'] }],
  skills: [{ category: 'Programming', count: 1, list: ['JS'] }],
  certifications: []
});

describe('applyScoreFloor', () => {
  it('applies floor when all required sections are present', () => {
    const resume = createBaseResume();
    resume.origin = 'guided'; // Set origin to trigger floor
    const result = applyScoreFloor(80, resume);
    expect(result).toBe(90);
  });

  it('does not apply floor when origin is not guided or jd_optimized', () => {
    const resume = createBaseResume();
    resume.origin = 'manual'; // Origin that doesn't trigger floor
    const result = applyScoreFloor(80, resume);
    expect(result).toBe(80);
  });

  it('applies floor when origin is guided', () => {
    const resume = createBaseResume();
    resume.origin = 'guided';
    const result = applyScoreFloor(80, resume);
    expect(result).toBe(90);
  });

  it('applies floor when origin is jd_optimized', () => {
    const resume = createBaseResume();
    resume.origin = 'jd_optimized';
    const result = applyScoreFloor(80, resume);
    expect(result).toBe(90);
  });

  it('does not apply floor when origin is neither guided nor jd_optimized', () => {
    const resume = createBaseResume();
    resume.origin = 'manual'; // Some other origin
    const result = applyScoreFloor(80, resume);
    expect(result).toBe(80);
  });

  it('applies floor correctly if calculated score is already above 90', () => {
    const resume = createBaseResume();
    resume.origin = 'jd_optimized';
    const result = applyScoreFloor(95, resume);
    expect(result).toBe(95);
  });
});

