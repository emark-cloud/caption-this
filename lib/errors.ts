// Error detection and user-friendly messaging for GenLayer transactions

export interface ParsedError {
  type: "validator_disagreement" | "contract_error" | "network_error" | "unknown";
  message: string;
  details?: string;
}

// Keywords that indicate validator disagreement in GenLayer
const VALIDATOR_DISAGREEMENT_KEYWORDS = [
  "equivalence",
  "consensus",
  "validators disagree",
  "validator disagreement",
  "non-deterministic",
  "different results",
  "mismatch",
  "agreement",
  "finality",
];

// Keywords that indicate contract-level errors
const CONTRACT_ERROR_KEYWORDS = [
  "UserError",
  "revert",
  "execution reverted",
  "AI evaluation",
  "empty response",
  "not valid JSON",
  "missing score",
  "missing winner",
];

/**
 * Parse an error from GenLayer transactions and return a user-friendly message
 */
export function parseGenLayerError(error: unknown): ParsedError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Check for validator disagreement
  if (VALIDATOR_DISAGREEMENT_KEYWORDS.some((kw) => lowerMessage.includes(kw.toLowerCase()))) {
    return {
      type: "validator_disagreement",
      message:
        "Validators could not reach agreement on the winner. This can happen when captions are very close in quality. Please try resolving again.",
      details: errorMessage,
    };
  }

  // Check for contract-level errors
  if (CONTRACT_ERROR_KEYWORDS.some((kw) => lowerMessage.includes(kw.toLowerCase()))) {
    // Extract the actual error message if it's a UserError
    const userErrorMatch = errorMessage.match(/UserError[:\s]+(.+)/i);
    if (userErrorMatch) {
      return {
        type: "contract_error",
        message: userErrorMatch[1].trim(),
        details: errorMessage,
      };
    }

    return {
      type: "contract_error",
      message: "The contract encountered an error during resolution.",
      details: errorMessage,
    };
  }

  // Check for network errors
  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("connection") ||
    lowerMessage.includes("fetch")
  ) {
    return {
      type: "network_error",
      message: "Network error. Please check your connection and try again.",
      details: errorMessage,
    };
  }

  // Generic transaction revert
  if (lowerMessage.includes("reverted") || lowerMessage.includes("revert")) {
    return {
      type: "validator_disagreement",
      message:
        "The resolution transaction was rejected. Validators may have disagreed on the result. Please try again.",
      details: errorMessage,
    };
  }

  // Unknown error
  return {
    type: "unknown",
    message: errorMessage || "An unexpected error occurred. Please try again.",
    details: errorMessage,
  };
}

/**
 * Get a user-friendly error message for display
 */
export function getErrorMessage(error: unknown): string {
  return parseGenLayerError(error).message;
}
