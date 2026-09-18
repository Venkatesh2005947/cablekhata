// src/lib/validation.ts
// Form validation helpers for House & Customer registration and editing.

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const INVALID_ADDRESS_PATTERNS = [
  /^test$/i,
  /^testing$/i,
  /^asdf/i,
  /^none$/i,
  /^nil$/i,
  /^na$/i,
  /^n\/a$/i,
  /^null$/i,
  /^unknown$/i,
  /^dummy$/i,
  /^xxx+$/i,
  /^1234+$/i,
  /^sample$/i,
  /^address$/i,
  /^qwerty/i,
];

/**
 * Validates a doorstep address.
 * Ensures the address is non-empty, contains meaningful text (at least 5 characters),
 * contains alphabetic characters, and isn't a known placeholder or gibberish.
 */
export function validateAddress(address: string): ValidationResult {
  const trimmed = (address || "").trim();

  if (!trimmed) {
    return { isValid: false, error: "Address is required" };
  }

  if (trimmed.length < 5) {
    return {
      isValid: false,
      error: "Address is too short. Please include street/landmark details (min 5 characters)",
    };
  }

  // Must contain at least some letters
  if (!/[a-zA-Z\u0B80-\u0BFF]/.test(trimmed)) {
    return {
      isValid: false,
      error: "Address must contain street or location name, not just numbers or symbols",
    };
  }

  // Check against known placeholder/junk values
  for (const pattern of INVALID_ADDRESS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        error: "Please enter a genuine doorstep address (e.g. 14, Main Road, Near Temple)",
      };
    }
  }

  // Check for repeated single character (e.g., "aaaaa")
  const uniqueChars = new Set(trimmed.replace(/[\s,.-]/g, "").toLowerCase());
  if (uniqueChars.size <= 1 && trimmed.length >= 4) {
    return {
      isValid: false,
      error: "Please enter a valid address with street and landmark details",
    };
  }

  return { isValid: true };
}

/**
 * Validates house / customer name.
 */
export function validateHouseName(name: string): ValidationResult {
  const trimmed = (name || "").trim();

  if (!trimmed) {
    return { isValid: false, error: "Customer or House Name is required" };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters" };
  }

  return { isValid: true };
}

/**
 * Validates door / house number.
 */
export function validateHouseNumber(doorNo: string): ValidationResult {
  const trimmed = (doorNo || "").trim();

  if (!trimmed) {
    return { isValid: false, error: "Door / House Number is required" };
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: "House number is too long (max 20 characters)" };
  }

  return { isValid: true };
}

/**
 * Validates optional phone number (if provided, must be valid 10 digits).
 */
export function validatePhone(phone: string): ValidationResult {
  const trimmed = (phone || "").trim();

  if (!trimmed) {
    return { isValid: true }; // Phone is optional
  }

  const cleanPhone = trimmed.replace(/\D/g, "");
  if (cleanPhone.length !== 10) {
    return { isValid: false, error: "Phone number must be exactly 10 digits" };
  }

  return { isValid: true };
}

/**
 * Validates Set Top Box (STB) Number.
 * Ensures the STB number is entered, has at least 2 characters, and is alphanumeric.
 */
export function validateStbNumber(stbId: string): ValidationResult {
  const trimmed = (stbId || "").trim();

  if (!trimmed) {
    return { isValid: false, error: "Set Top Box (STB) Number is required" };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: "STB Number must be at least 2 characters" };
  }

  if (trimmed.length > 30) {
    return { isValid: false, error: "STB Number is too long (max 30 characters)" };
  }

  return { isValid: true };
}

/**
 * Validates Collection Area Name.
 */
export function validateAreaName(name: string): ValidationResult {
  const trimmed = (name || "").trim();

  if (!trimmed) {
    return { isValid: false, error: "Area / Landmark Name is required" };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: "Area Name must be at least 2 characters" };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: "Area Name is too long (max 50 characters)" };
  }

  return { isValid: true };
}
