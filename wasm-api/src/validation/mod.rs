use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ValidationType {
    Required,
    Email,
    Phone,
    ZipCode,
    CreditCard,
    MinLength,
    MaxLength,
    Pattern,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationRule {
    pub rule_type: ValidationType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub param: Option<String>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationError {
    pub field: String,
    pub message: String,
}

#[wasm_bindgen]
pub struct Validator;

#[wasm_bindgen]
impl Validator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Validator {
        Validator
    }

    /// Validate a single field value
    pub fn validate_field(&self, value: &str, rule: JsValue) -> Result<bool, JsValue> {
        let rule: ValidationRule = serde_wasm_bindgen::from_value(rule)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse rule: {}", e)))?;

        let is_valid = match rule.rule_type {
            ValidationType::Required => !value.trim().is_empty(),
            ValidationType::Email => self.validate_email(value),
            ValidationType::Phone => self.validate_phone(value),
            ValidationType::ZipCode => self.validate_zipcode(value),
            ValidationType::CreditCard => self.validate_credit_card(value),
            ValidationType::MinLength => {
                if let Some(param) = &rule.param {
                    if let Ok(min) = param.parse::<usize>() {
                        value.len() >= min
                    } else {
                        false
                    }
                } else {
                    false
                }
            }
            ValidationType::MaxLength => {
                if let Some(param) = &rule.param {
                    if let Ok(max) = param.parse::<usize>() {
                        value.len() <= max
                    } else {
                        false
                    }
                } else {
                    false
                }
            }
            ValidationType::Pattern => {
                if let Some(pattern) = &rule.param {
                    // Simple pattern matching (would use regex in production)
                    value.contains(pattern)
                } else {
                    false
                }
            }
        };

        Ok(is_valid)
    }

    /// Validate email format
    fn validate_email(&self, email: &str) -> bool {
        // Simple email validation (production would use regex)
        email.contains('@') && email.contains('.') && email.len() >= 5
    }

    /// Validate phone number
    fn validate_phone(&self, phone: &str) -> bool {
        // Remove common phone number characters
        let digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
        digits.len() >= 10
    }

    /// Validate US ZIP code
    fn validate_zipcode(&self, zip: &str) -> bool {
        let digits: String = zip.chars().filter(|c| c.is_ascii_digit()).collect();
        digits.len() == 5 || digits.len() == 9
    }

    /// Validate credit card using Luhn algorithm
    fn validate_credit_card(&self, card: &str) -> bool {
        let digits: String = card.chars().filter(|c| c.is_ascii_digit()).collect();

        if digits.len() < 13 || digits.len() > 19 {
            return false;
        }

        // Luhn algorithm
        let mut sum = 0;
        let mut double = false;

        for ch in digits.chars().rev() {
            if let Some(digit) = ch.to_digit(10) {
                let mut digit = digit;
                if double {
                    digit *= 2;
                    if digit > 9 {
                        digit -= 9;
                    }
                }
                sum += digit;
                double = !double;
            } else {
                return false;
            }
        }

        sum % 10 == 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_email_validation() {
        let validator = Validator::new();
        assert!(validator.validate_email("test@example.com"));
        assert!(!validator.validate_email("invalid-email"));
    }

    #[test]
    fn test_credit_card_luhn() {
        let validator = Validator::new();
        // Valid test card number
        assert!(validator.validate_credit_card("4532015112830366"));
        // Invalid
        assert!(!validator.validate_credit_card("4532015112830367"));
    }
}
