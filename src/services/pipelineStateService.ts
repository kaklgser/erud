// src/services/pipelineStateService.ts
// Service for persisting and restoring pipeline state

import { PipelineExecutionContext, PipelineState } from '../types/pipeline';

export class PipelineStateService {
  private static readonly STORAGE_KEY_PREFIX = 'pipeline_state_';
  private static readonly MAX_STORED_SESSIONS = 10;

  /**
   * Save pipeline context to localStorage
   */
  static saveContext(context: PipelineExecutionContext): void {
    try {
      const key = this.getStorageKey(context.sessionId);
      const serializedContext = JSON.stringify({
        ...context,
        startTime: context.startTime.toISOString(),
        stepHistory: context.stepHistory.map(step => ({
          ...step,
          startTime: step.startTime.toISOString(),
          endTime: step.endTime?.toISOString()
        })),
        resumeVersions: context.resumeVersions.map(version => ({
          ...version,
          timestamp: version.timestamp.toISOString()
        })),
        userInputs: context.userInputs.map(input => ({
          ...input,
          timestamp: input.timestamp.toISOString()
        })),
        errorLog: context.errorLog.map(error => ({
          ...error,
          timestamp: error.timestamp.toISOString()
        }))
      });

      localStorage.setItem(key, serializedContext);
      this.cleanupOldSessions();
      
      console.log(`💾 Pipeline context saved for session: ${context.sessionId}`);
    } catch (error) {
      console.error('Failed to save pipeline context:', error);
    }
  }

  /**
   * Load pipeline context from localStorage
   */
  static loadContext(sessionId: string): PipelineExecutionContext | null {
    try {
      const key = this.getStorageKey(sessionId);
      const serializedContext = localStorage.getItem(key);
      
      if (!serializedContext) {
        return null;
      }

      const context = JSON.parse(serializedContext);
      
      // Deserialize dates
      return {
        ...context,
        startTime: new Date(context.startTime),
        stepHistory: context.stepHistory.map((step: any) => ({
          ...step,
          startTime: new Date(step.startTime),
          endTime: step.endTime ? new Date(step.endTime) : undefined
        })),
        resumeVersions: context.resumeVersions.map((version: any) => ({
          ...version,
          timestamp: new Date(version.timestamp)
        })),
        userInputs: context.userInputs.map((input: any) => ({
          ...input,
          timestamp: new Date(input.timestamp)
        })),
        errorLog: context.errorLog.map((error: any) => ({
          ...error,
          timestamp: new Date(error.timestamp)
        }))
      };
    } catch (error) {
      console.error('Failed to load pipeline context:', error);
      return null;
    }
  }

  /**
   * Delete pipeline context from localStorage
   */
  static deleteContext(sessionId: string): void {
    try {
      const key = this.getStorageKey(sessionId);
      localStorage.removeItem(key);
      console.log(`🗑️ Pipeline context deleted for session: ${sessionId}`);
    } catch (error) {
      console.error('Failed to delete pipeline context:', error);
    }
  }

  /**
   * Get all stored session IDs for a user
   */
  static getUserSessions(userId: string): string[] {
    try {
      const sessions: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_KEY_PREFIX)) {
          const sessionId = key.replace(this.STORAGE_KEY_PREFIX, '');
          const context = this.loadContext(sessionId);
          
          if (context && context.userId === userId) {
            sessions.push(sessionId);
          }
        }
      }
      
      return sessions.sort((a, b) => {
        const contextA = this.loadContext(a);
        const contextB = this.loadContext(b);
        
        if (!contextA || !contextB) return 0;
        
        return contextB.startTime.getTime() - contextA.startTime.getTime();
      });
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Check if a session can be resumed (not expired)
   */
  static canResumeSession(sessionId: string): boolean {
    const context = this.loadContext(sessionId);
    if (!context) return false;

    const now = new Date();
    const sessionAge = now.getTime() - context.startTime.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    return sessionAge < maxAge;
  }

  /**
   * Get resumable sessions for a user
   */
  static getResumableSessions(userId: string): PipelineExecutionContext[] {
    const sessionIds = this.getUserSessions(userId);
    const resumableSessions: PipelineExecutionContext[] = [];

    for (const sessionId of sessionIds) {
      if (this.canResumeSession(sessionId)) {
        const context = this.loadContext(sessionId);
        if (context) {
          resumableSessions.push(context);
        }
      }
    }

    return resumableSessions;
  }

  /**
   * Save pipeline state snapshot (lighter than full context)
   */
  static saveStateSnapshot(state: PipelineState): void {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}snapshot_${state.sessionId}`;
      const serializedState = JSON.stringify({
        ...state,
        startTime: state.startTime.toISOString(),
        lastUpdated: state.lastUpdated.toISOString()
      });

      localStorage.setItem(key, serializedState);
    } catch (error) {
      console.error('Failed to save state snapshot:', error);
    }
  }

  /**
   * Load pipeline state snapshot
   */
  static loadStateSnapshot(sessionId: string): PipelineState | null {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}snapshot_${sessionId}`;
      const serializedState = localStorage.getItem(key);
      
      if (!serializedState) {
        return null;
      }

      const state = JSON.parse(serializedState);
      
      return {
        ...state,
        startTime: new Date(state.startTime),
        lastUpdated: new Date(state.lastUpdated)
      };
    } catch (error) {
      console.error('Failed to load state snapshot:', error);
      return null;
    }
  }

  /**
   * Clear all pipeline data for a user
   */
  static clearUserData(userId: string): void {
    try {
      const sessionIds = this.getUserSessions(userId);
      
      for (const sessionId of sessionIds) {
        this.deleteContext(sessionId);
        
        // Also delete snapshot
        const snapshotKey = `${this.STORAGE_KEY_PREFIX}snapshot_${sessionId}`;
        localStorage.removeItem(snapshotKey);
      }
      
      console.log(`🧹 Cleared pipeline data for user: ${userId}`);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  /**
   * Get storage usage statistics
   */
  static getStorageStats(): { totalSessions: number; totalSize: number; oldestSession: Date | null } {
    let totalSessions = 0;
    let totalSize = 0;
    let oldestSession: Date | null = null;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_KEY_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSessions++;
            totalSize += value.length;
            
            if (key.includes('snapshot_')) continue;
            
            const sessionId = key.replace(this.STORAGE_KEY_PREFIX, '');
            const context = this.loadContext(sessionId);
            
            if (context) {
              if (!oldestSession || context.startTime < oldestSession) {
                oldestSession = context.startTime;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error);
    }

    return { totalSessions, totalSize, oldestSession };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private static getStorageKey(sessionId: string): string {
    return `${this.STORAGE_KEY_PREFIX}${sessionId}`;
  }

  private static cleanupOldSessions(): void {
    try {
      const allSessions: { sessionId: string; startTime: Date }[] = [];
      
      // Collect all sessions with their start times
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_KEY_PREFIX) && !key.includes('snapshot_')) {
          const sessionId = key.replace(this.STORAGE_KEY_PREFIX, '');
          const context = this.loadContext(sessionId);
          
          if (context) {
            allSessions.push({ sessionId, startTime: context.startTime });
          }
        }
      }
      
      // Sort by start time (newest first)
      allSessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
      
      // Remove sessions beyond the limit
      if (allSessions.length > this.MAX_STORED_SESSIONS) {
        const sessionsToDelete = allSessions.slice(this.MAX_STORED_SESSIONS);
        
        for (const session of sessionsToDelete) {
          this.deleteContext(session.sessionId);
          
          // Also delete snapshot
          const snapshotKey = `${this.STORAGE_KEY_PREFIX}snapshot_${session.sessionId}`;
          localStorage.removeItem(snapshotKey);
        }
        
        console.log(`🧹 Cleaned up ${sessionsToDelete.length} old pipeline sessions`);
      }
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
    }
  }
}