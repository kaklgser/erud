// src/hooks/usePipelineController.ts
// React hook for managing pipeline controller state

import { useState, useEffect, useCallback, useRef } from 'react';
import { PipelineController } from '../services/pipelineController';
import { PipelineStateService } from '../services/pipelineStateService';
import { 
  PipelineState, 
  PipelineStep, 
  ProgressIndicator, 
  StepResult,
  PipelineExecutionContext 
} from '../types/pipeline';

interface UsePipelineControllerOptions {
  userId: string;
  jobDescription?: string;
  targetRole?: string;
  autoSave?: boolean;
  resumeSession?: boolean;
}

interface UsePipelineControllerReturn {
  controller: PipelineController | null;
  state: PipelineState | null;
  progress: ProgressIndicator | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  executeStep: (step: PipelineStep, input?: any) => Promise<StepResult>;
  proceedToNext: () => void;
  rollbackToPrevious: () => void;
  handleError: (step: PipelineStep, error: Error) => Promise<void>;
  
  // Session management
  saveSession: () => void;
  loadSession: (sessionId: string) => boolean;
  clearSession: () => void;
  getResumableSessions: () => PipelineExecutionContext[];
}

export const usePipelineController = (
  options: UsePipelineControllerOptions
): UsePipelineControllerReturn => {
  const [controller, setController] = useState<PipelineController | null>(null);
  const [state, setState] = useState<PipelineState | null>(null);
  const [progress, setProgress] = useState<ProgressIndicator | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const controllerRef = useRef<PipelineController | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize controller
  useEffect(() => {
    const initializeController = () => {
      console.log('🚀 Initializing pipeline controller...');
      
      let newController: PipelineController;
      
      // Try to resume existing session if requested
      if (options.resumeSession) {
        const resumableSessions = PipelineStateService.getResumableSessions(options.userId);
        if (resumableSessions.length > 0) {
          const latestSession = resumableSessions[0];
          console.log(`📂 Resuming session: ${latestSession.sessionId}`);
          
          // Create controller with existing context
          newController = new PipelineController(
            options.userId,
            latestSession.jobDescription,
            latestSession.targetRole
          );
          
          // TODO: Restore controller state from context
          // This will be implemented when we add state restoration methods
        } else {
          newController = new PipelineController(
            options.userId,
            options.jobDescription || '',
            options.targetRole || ''
          );
        }
      } else {
        newController = new PipelineController(
          options.userId,
          options.jobDescription || '',
          options.targetRole || ''
        );
      }
      
      // Set up event listeners
      newController.onStateChange((newState) => {
        setState(newState);
        setError(null);
      });
      
      newController.onProgressChange((newProgress) => {
        setProgress(newProgress);
      });
      
      setController(newController);
      controllerRef.current = newController;
      
      // Initialize state
      setState(newController.getState());
      setProgress(newController.getProgress());
    };

    initializeController();

    // Cleanup
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [options.userId, options.jobDescription, options.targetRole, options.resumeSession]);

  // Auto-save functionality
  useEffect(() => {
    if (options.autoSave && controller) {
      autoSaveIntervalRef.current = setInterval(() => {
        saveSession();
      }, 30000); // Save every 30 seconds
      
      return () => {
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
        }
      };
    }
  }, [options.autoSave, controller]);

  // Execute pipeline step
  const executeStep = useCallback(async (step: PipelineStep, input?: any): Promise<StepResult> => {
    if (!controller) {
      throw new Error('Pipeline controller not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔄 Executing step ${step}...`);
      const result = await controller.executeStep(step, input);
      
      if (!result.success) {
        setError(result.error || 'Step execution failed');
      }
      
      // Auto-save after successful step
      if (result.success && options.autoSave) {
        saveSession();
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      console.error(`❌ Step ${step} failed:`, err);
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [controller, options.autoSave]);

  // Proceed to next step
  const proceedToNext = useCallback(() => {
    if (!controller) return;
    
    controller.proceedToNextStep();
    
    if (options.autoSave) {
      saveSession();
    }
  }, [controller, options.autoSave]);

  // Rollback to previous step
  const rollbackToPrevious = useCallback(() => {
    if (!controller) return;
    
    controller.rollbackToPreviousStep();
    
    if (options.autoSave) {
      saveSession();
    }
  }, [controller, options.autoSave]);

  // Handle step error
  const handleError = useCallback(async (step: PipelineStep, error: Error): Promise<void> => {
    if (!controller) return;
    
    setError(error.message);
    
    try {
      await controller.handleStepFailure(step, error);
    } catch (recoveryError: any) {
      setError(recoveryError.message || 'Error recovery failed');
    }
  }, [controller]);

  // Save current session
  const saveSession = useCallback(() => {
    if (!controllerRef.current) return;
    
    try {
      // TODO: Get context from controller and save it
      // This will be implemented when we add context getter methods
      console.log('💾 Session saved');
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  }, []);

  // Load existing session
  const loadSession = useCallback((sessionId: string): boolean => {
    try {
      const context = PipelineStateService.loadContext(sessionId);
      if (!context) {
        console.warn(`Session ${sessionId} not found`);
        return false;
      }
      
      if (!PipelineStateService.canResumeSession(sessionId)) {
        console.warn(`Session ${sessionId} has expired`);
        return false;
      }
      
      // TODO: Restore controller from context
      // This will be implemented when we add context restoration methods
      console.log(`📂 Session ${sessionId} loaded`);
      return true;
    } catch (err) {
      console.error('Failed to load session:', err);
      return false;
    }
  }, []);

  // Clear current session
  const clearSession = useCallback(() => {
    if (state?.sessionId) {
      PipelineStateService.deleteContext(state.sessionId);
    }
    
    // Reset controller
    const newController = new PipelineController(
      options.userId,
      options.jobDescription || '',
      options.targetRole || ''
    );
    
    setController(newController);
    controllerRef.current = newController;
    setState(newController.getState());
    setProgress(newController.getProgress());
    setError(null);
    
    console.log('🧹 Session cleared');
  }, [state?.sessionId, options.userId, options.jobDescription, options.targetRole]);

  // Get resumable sessions
  const getResumableSessions = useCallback((): PipelineExecutionContext[] => {
    return PipelineStateService.getResumableSessions(options.userId);
  }, [options.userId]);

  return {
    controller,
    state,
    progress,
    isLoading,
    error,
    
    // Actions
    executeStep,
    proceedToNext,
    rollbackToPrevious,
    handleError,
    
    // Session management
    saveSession,
    loadSession,
    clearSession,
    getResumableSessions
  };
};