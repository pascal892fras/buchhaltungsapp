/**
 * Error Handling & Fehler-Management
 * Zentrale Fehlerbehandlung für die gesamte App
 */

/**
 * Error Typen
 */
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  OCR_ERROR: 'OCR_ERROR',
  PDF_ERROR: 'PDF_ERROR',
  DATA_ERROR: 'DATA_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

/**
 * Zentrale Error-Klasse
 */
export class AppError extends Error {
  constructor(type, message, details = null) {
    super(message);
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Error Handler mit Logging
 */
export const errorHandler = {
  /**
   * Behandelt Fehler und gibt User-freundliche Nachricht zurück
   */
  handle: (error, context = '') => {
    const timestamp = new Date().toISOString();
    const errorLog = {
      timestamp,
      context,
      type: error?.type || ErrorTypes.UNKNOWN_ERROR,
      message: error?.message || 'Unbekannter Fehler',
      stack: error?.stack,
      details: error?.details,
    };

    // Log in Console (nur entwicklung)
    console.error(`[${timestamp}] ${context}:`, errorLog);

    // In Production: zu Server senden (später implementieren)
    // if (process.env.NODE_ENV === 'production') {
    //   sendErrorToServer(errorLog);
    // }

    return {
      type: error?.type || ErrorTypes.UNKNOWN_ERROR,
      userMessage: getUserFriendlyMessage(error),
      technicalMessage: error?.message || 'Unbekannter Fehler',
      isRetryable: isRetryableError(error),
    };
  },

  /**
   * Throws AppError
   */
  throw: (type, message, details) => {
    throw new AppError(type, message, details);
  },

  /**
   * Safe wrapper für async Funktionen
   */
  asyncWrap: (fn) => {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        return errorHandler.handle(error, fn.name);
      }
    };
  },
};

/**
 * User-freundliche Fehlermeldungen
 */
function getUserFriendlyMessage(error) {
  const messages = {
    [ErrorTypes.VALIDATION_ERROR]:
      'Bitte überprüfen Sie Ihre Eingaben. Es gibt einen Fehler in den Daten.',
    [ErrorTypes.STORAGE_ERROR]:
      'Fehler beim Speichern. Bitte versuchen Sie es später erneut.',
    [ErrorTypes.OCR_ERROR]:
      'OCR konnte den Text nicht erkennen. Bitte ein klareres Foto versuchen.',
    [ErrorTypes.PDF_ERROR]: 'Fehler beim Erstellen des PDF. Bitte versuchen Sie es erneut.',
    [ErrorTypes.DATA_ERROR]: 'Fehler bei der Datenverarbeitung. Bitte versuchen Sie es erneut.',
    [ErrorTypes.NETWORK_ERROR]:
      'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.',
    [ErrorTypes.UNKNOWN_ERROR]: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  };

  return messages[error?.type] || messages[ErrorTypes.UNKNOWN_ERROR];
}

/**
 * Prüft, ob ein Fehler wiederholbar ist
 */
function isRetryableError(error) {
  const retryableTypes = [
    ErrorTypes.NETWORK_ERROR,
    ErrorTypes.STORAGE_ERROR,
    ErrorTypes.OCR_ERROR,
  ];
  return retryableTypes.includes(error?.type);
}

/**
 * Try-Catch Helper mit Logging
 */
export function tryCatch(fn, context = 'Operation') {
  return (...args) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((error) => {
          errorHandler.handle(error, context);
          throw error;
        });
      }
      return result;
    } catch (error) {
      errorHandler.handle(error, context);
      throw error;
    }
  };
}

/**
 * Error Boundary für React Components
 */
export class ErrorBoundary {
  static capture(component, errorFallback) {
    return {
      componentDidCatch: (error, errorInfo) => {
        errorHandler.handle(error, `React Component: ${component.name}`);
        if (errorFallback) errorFallback(error);
      },
    };
  }
}
