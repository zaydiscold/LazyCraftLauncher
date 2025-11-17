/**
 * Wizard State Management Hook
 *
 * This custom React hook manages the state and navigation logic for the
 * setup wizard. It separates business logic from UI components, making
 * the wizard easier to test and maintain.
 *
 * **Features:**
 * - Step navigation (forward/backward)
 * - Answer storage and validation
 * - Error handling
 * - Quick launch support
 *
 * @module ui/hooks/useWizard
 */

import { useState } from 'react';
import { validateWorld } from '../../core/world.js';
import type { LazyConfig, SystemInfo, WizardAnswers } from '../../types/index.js';

/**
 * Available wizard steps in order of appearance
 */
export type WizardStep =
  | 'mode'
  | 'serverType'
  | 'version'
  | 'world'
  | 'worldPath'
  | 'ram'
  | 'port'
  | 'profile'
  | 'advanced'
  | 'confirm';

/**
 * Wizard state and actions returned by the hook
 */
export interface WizardState {
  // Current state
  step: WizardStep;
  answers: WizardAnswers;
  inputValue: string;
  error: string | null;

  // Navigation actions
  goToStep: (step: WizardStep) => void;
  goNext: () => void;
  goBack: () => void;

  // Input actions
  setInputValue: (value: string) => void;
  setError: (error: string | null) => void;
  updateAnswer: <K extends keyof WizardAnswers>(key: K, value: WizardAnswers[K]) => void;

  // Validation actions
  validateRam: (ramGB: number, maxRam: number) => boolean;
  validatePort: (port: number) => boolean;
  validateWorldPath: (path: string, isExisting: boolean) => Promise<boolean>;
}

/**
 * Step navigation map - defines which step comes after which
 */
const STEP_FLOW: Record<WizardStep, WizardStep | null> = {
  mode: 'serverType',
  serverType: 'version',
  version: 'world',
  world: null, // Conditional: either worldPath or ram
  worldPath: 'ram',
  ram: 'port',
  port: 'profile',
  profile: 'advanced',
  advanced: 'confirm',
  confirm: null, // Final step
};

/**
 * Custom hook for managing wizard state and logic
 *
 * @param savedConfig - Previously saved configuration (for quick launch)
 * @param systemInfo - System information (for validation)
 * @returns Wizard state and action methods
 *
 * @example
 * ```typescript
 * const wizard = useWizard(savedConfig, systemInfo);
 *
 * // Navigate to next step
 * wizard.goNext();
 *
 * // Update an answer
 * wizard.updateAnswer('serverType', 'vanilla');
 *
 * // Validate RAM
 * const isValid = wizard.validateRam(4, 8);
 * ```
 */
export function useWizard(
  savedConfig: LazyConfig | null,
  systemInfo: SystemInfo
): WizardState {
  // State management
  const [step, setStep] = useState<WizardStep>('mode');
  const [answers, setAnswers] = useState<WizardAnswers>({
    mode: savedConfig ? 'quick' : 'advanced',
  });
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  /**
   * Navigate to a specific step
   */
  const goToStep = (newStep: WizardStep) => {
    setStep(newStep);
    setError(null); // Clear errors when changing steps
    setInputValue(''); // Clear input when changing steps
  };

  /**
   * Go to the next step based on current step and answers
   */
  const goNext = () => {
    const nextStep = STEP_FLOW[step];

    // Special case: After world selection, decide between worldPath or ram
    if (step === 'world') {
      if (answers.worldChoice === 'existing') {
        goToStep('worldPath');
      } else {
        // For new world, set default path and skip to RAM
        updateAnswer('worldPath', './world');
        goToStep('ram');
      }
      return;
    }

    // Normal navigation
    if (nextStep) {
      goToStep(nextStep);
    }
  };

  /**
   * Go back to the previous step
   * Note: This is a simplified implementation.
   * For full backward navigation, you'd need to track history.
   */
  const goBack = () => {
    // Simplified back navigation - you could implement a history stack for full support
    const steps: WizardStep[] = [
      'mode',
      'serverType',
      'version',
      'world',
      'worldPath',
      'ram',
      'port',
      'profile',
      'advanced',
      'confirm',
    ];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      goToStep(steps[currentIndex - 1]);
    }
  };

  /**
   * Update a specific answer in the wizard state
   */
  const updateAnswer = <K extends keyof WizardAnswers>(
    key: K,
    value: WizardAnswers[K]
  ) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Validate RAM allocation
   *
   * @param ramGB - Requested RAM in GB
   * @param maxRam - Maximum recommended RAM (80% of total system RAM)
   * @returns True if valid, false if too much RAM requested
   */
  const validateRam = (ramGB: number, maxRam: number): boolean => {
    if (ramGB < 1) {
      setError('RAM must be at least 1GB');
      return false;
    }

    if (ramGB > maxRam) {
      setError(
        `Too much RAM! You have ${systemInfo.totalRAMGB}GB total. Max recommended: ${maxRam}GB`
      );
      return false;
    }

    setError(null);
    return true;
  };

  /**
   * Validate port number
   *
   * @param port - Requested port number
   * @returns True if valid, false if out of range
   */
  const validatePort = (port: number): boolean => {
    if (port < 1024 || port > 65535) {
      setError('Port must be between 1024 and 65535');
      return false;
    }

    setError(null);
    return true;
  };

  /**
   * Validate world path
   *
   * @param path - Path to world folder
   * @param isExisting - Whether this is an existing world or new world
   * @returns Promise<boolean> - True if valid
   */
  const validateWorldPath = async (
    path: string,
    isExisting: boolean
  ): Promise<boolean> => {
    if (!isExisting) {
      // New worlds don't need validation
      return true;
    }

    // Validate existing world
    const isValid = await validateWorld(path);
    if (!isValid) {
      setError('Invalid world folder. Missing level.dat or region/ directory.');
      return false;
    }

    setError(null);
    return true;
  };

  return {
    // State
    step,
    answers,
    inputValue,
    error,

    // Navigation
    goToStep,
    goNext,
    goBack,

    // Input management
    setInputValue,
    setError,
    updateAnswer,

    // Validation
    validateRam,
    validatePort,
    validateWorldPath,
  };
}
