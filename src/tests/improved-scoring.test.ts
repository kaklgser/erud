/**
 * Test for improved scoring and confidence logic
 */

import { ScoreMapperService } from '../services/scoreMapperService';

describe('Improved Scoring Logic', () => {
  it('should map scores to more user-friendly match bands', () => {
    // Test the new, more user-friendly thresholds
    expect(ScoreMapperService.getMatchBand(68)).toBe('Good Match'); // Was "Fair Match" before
    expect(ScoreMapperService.getMatchBand(75)).toBe('Very Good Match');
    expect(ScoreMapperService.getMatchBand(85)).toBe('Excellent Match');
    expect(ScoreMapperService.getMatchBand(60)).toBe('Fair Match');
    expect(ScoreMapperService.getMatchBand(50)).toBe('Below Average');
    
    console.log('✅ Score 68 now correctly shows as "Good Match"');
    console.log('✅ Thresholds are more user-friendly');
  });

  it('should show appropriate interview probabilities', () => {
    const goodMatchProb = ScoreMapperService.getInterviewProbabilityFromScore(68);
    const veryGoodMatchProb = ScoreMapperService.getInterviewProbabilityFromScore(75);
    
    expect(goodMatchProb).toBe('55-69%'); // Good Match range
    expect(veryGoodMatchProb).toBe('70-84%'); // Very Good Match range
    
    console.log('✅ Score 68 shows 55-69% interview probability');
    console.log('✅ Interview probabilities are more realistic');
  });
});