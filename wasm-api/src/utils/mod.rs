use wasm_bindgen::prelude::*;
use web_sys::console;

/// Log a message to the browser console
#[wasm_bindgen]
pub fn log(message: &str) {
    console::log_1(&JsValue::from_str(message));
}

/// Log an error to the browser console
#[wasm_bindgen]
pub fn error(message: &str) {
    console::error_1(&JsValue::from_str(message));
}

/// Log a warning to the browser console
#[wasm_bindgen]
pub fn warn(message: &str) {
    console::warn_1(&JsValue::from_str(message));
}

/// Format currency
#[wasm_bindgen]
pub fn format_currency(amount: f64, currency: &str) -> String {
    match currency.to_uppercase().as_str() {
        "USD" => format!("${:.2}", amount),
        "EUR" => format!("€{:.2}", amount),
        "GBP" => format!("£{:.2}", amount),
        _ => format!("{:.2} {}", amount, currency),
    }
}

/// Parse currency string to float
#[wasm_bindgen]
pub fn parse_currency(value: &str) -> Result<f64, JsValue> {
    // Remove currency symbols and commas
    let cleaned = value
        .replace('$', "")
        .replace('€', "")
        .replace('£', "")
        .replace(',', "");

    cleaned
        .trim()
        .parse::<f64>()
        .map_err(|e| JsValue::from_str(&format!("Failed to parse currency: {}", e)))
}

/// Generate a simple unique ID
#[wasm_bindgen]
pub fn generate_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();

    format!("{:x}", timestamp)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_currency() {
        assert_eq!(format_currency(99.99, "USD"), "$99.99");
        assert_eq!(format_currency(99.99, "EUR"), "€99.99");
    }

    #[test]
    fn test_parse_currency() {
        assert_eq!(parse_currency("$99.99").unwrap(), 99.99);
        assert_eq!(parse_currency("€1,234.56").unwrap(), 1234.56);
    }
}
