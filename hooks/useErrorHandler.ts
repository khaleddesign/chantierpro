import { useState, useCallback } from 'react';
import { useToasts } from '@/hooks/useToasts';

interface ErrorInfo {
  message: string;
  code?: string;
  statusCode?: number;
  timestamp: Date;
}

interface UseErrorHandlerReturn {
  error: ErrorInfo | null;
  clearError: () => void;
  handleError: (error: unknown, customMessage?: string) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  withErrorHandling: <T extends unknown[], R>(
    fn: (...args: T) => Promise<R>
  ) => (...args: T) => Promise<R | undefined>;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { error: showErrorToast, success } = useToasts();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    const errorInfo: ErrorInfo = {
      message: customMessage || 'Une erreur est survenue',
      timestamp: new Date()
    };

    if (error instanceof Error) {
      errorInfo.message = customMessage || error.message;
    } else if (typeof error === 'string') {
      errorInfo.message = customMessage || error;
    } else if (error && typeof error === 'object') {
      // Gestion des erreurs d'API
      const apiError = error as { 
        message?: string; 
        error?: string; 
        statusCode?: number; 
        code?: string 
      };
      
      errorInfo.message = customMessage || apiError.message || apiError.error || 'Erreur inconnue';
      errorInfo.statusCode = apiError.statusCode;
      errorInfo.code = apiError.code;
    }

    setError(errorInfo);
    
    // Afficher le toast d'erreur
    showErrorToast('Erreur', errorInfo.message);
    
    // Log l'erreur pour le debugging
    console.error('Error handled:', {
      original: error,
      processed: errorInfo
    });
  }, [showErrorToast]);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      clearError(); // Clear error when starting a new operation
    }
  }, [clearError]);

  // Wrapper pour automatiser la gestion d'erreurs et loading
  const withErrorHandling = useCallback(<T extends unknown[], R>(
    fn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      try {
        setLoading(true);
        const result = await fn(...args);
        return result;
      } catch (error) {
        handleError(error);
        return undefined;
      } finally {
        setLoading(false);
      }
    };
  }, [handleError, setLoading]);

  return {
    error,
    clearError,
    handleError,
    isLoading,
    setLoading,
    withErrorHandling
  };
}

// Hook spécialisé pour les opérations de validation
export function useValidation() {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: string, value: unknown, rules: ValidationRule[]) => {
    for (const rule of rules) {
      const error = rule.validate(value);
      if (error) {
        setValidationErrors(prev => ({ ...prev, [field]: error }));
        return false;
      }
    }
    
    // Clear error if validation passed
    setValidationErrors(prev => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
    return true;
  }, []);

  const validateForm = useCallback((data: Record<string, unknown>, schema: Record<string, ValidationRule[]>) => {
    const errors: Record<string, string> = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      for (const rule of rules) {
        const error = rule.validate(value);
        if (error) {
          errors[field] = error;
          isValid = false;
          break; // Stop at first error for this field
        }
      }
    }

    setValidationErrors(errors);
    return isValid;
  }, []);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  const getFieldError = useCallback((field: string) => {
    return validationErrors[field];
  }, [validationErrors]);

  const hasErrors = Object.keys(validationErrors).length > 0;

  return {
    validationErrors,
    validateField,
    validateForm,
    clearValidationErrors,
    getFieldError,
    hasErrors
  };
}

// Types et classes pour la validation
export interface ValidationRule {
  validate: (value: unknown) => string | null;
}

export class ValidationRules {
  static required(): ValidationRule {
    return {
      validate: (value: unknown) => {
        if (value === null || value === undefined || value === '') {
          return 'Ce champ est requis';
        }
        return null;
      }
    };
  }

  static email(): ValidationRule {
    return {
      validate: (value: unknown) => {
        if (typeof value !== 'string') return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Format email invalide';
        }
        return null;
      }
    };
  }

  static minLength(min: number): ValidationRule {
    return {
      validate: (value: unknown) => {
        if (typeof value !== 'string') return null;
        if (value.length < min) {
          return `Minimum ${min} caractères requis`;
        }
        return null;
      }
    };
  }

  static maxLength(max: number): ValidationRule {
    return {
      validate: (value: unknown) => {
        if (typeof value !== 'string') return null;
        if (value.length > max) {
          return `Maximum ${max} caractères autorisés`;
        }
        return null;
      }
    };
  }

  static phone(): ValidationRule {
    return {
      validate: (value: unknown) => {
        if (!value || typeof value !== 'string') return null;
        const phoneRegex = /^(\+33|0)[1-9](\d{8})$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          return 'Numéro de téléphone français invalide';
        }
        return null;
      }
    };
  }

  static numeric(): ValidationRule {
    return {
      validate: (value: unknown) => {
        if (value === null || value === undefined || value === '') return null;
        if (isNaN(Number(value))) {
          return 'Valeur numérique requise';
        }
        return null;
      }
    };
  }

  static min(min: number): ValidationRule {
    return {
      validate: (value: unknown) => {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        if (num < min) {
          return `Valeur minimum: ${min}`;
        }
        return null;
      }
    };
  }

  static max(max: number): ValidationRule {
    return {
      validate: (value: unknown) => {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        if (num > max) {
          return `Valeur maximum: ${max}`;
        }
        return null;
      }
    };
  }

  static oneOf(options: unknown[]): ValidationRule {
    return {
      validate: (value: unknown) => {
        if (!options.includes(value)) {
          return `Valeur doit être parmi: ${options.join(', ')}`;
        }
        return null;
      }
    };
  }
}