use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Variation {
    pub id: String,
    pub prompt: String,
    #[serde(rename = "type")]
    pub variation_type: String,
    #[serde(rename = "@options")]
    pub options: Vec<VariationOption>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariationOption {
    pub v: String,
    pub prompt: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub price_mod: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryItem {
    #[serde(rename = "SKU")]
    pub sku: String,
    #[serde(rename = "AVAILABLE")]
    pub available: String,
    #[serde(rename = "ONSHELF")]
    pub onshelf: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub pid: String,
    #[serde(rename = "@variations", default)]
    pub variations: Vec<Variation>,
    #[serde(rename = "@inventory", default)]
    pub inventory: HashMap<String, InventoryItem>,
    #[serde(rename = "%attribs")]
    pub attribs: HashMap<String, serde_json::Value>,
}

#[wasm_bindgen]
pub struct ProductProcessor {
    products: HashMap<String, Product>,
}

#[wasm_bindgen]
impl ProductProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ProductProcessor {
        ProductProcessor {
            products: HashMap::new(),
        }
    }

    /// Load a product from JSON
    pub fn load_product(&mut self, product_json: JsValue) -> Result<String, JsValue> {
        let product: Product = serde_wasm_bindgen::from_value(product_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse product: {}", e)))?;

        let pid = product.pid.clone();
        self.products.insert(pid.clone(), product);

        Ok(pid)
    }

    /// Generate SKU from base PID and variation selections
    /// Example: calculate_sku("TEST", {0: "00", 1: "01"}) -> "TEST:0001"
    pub fn calculate_sku(&self, pid: &str, selections: JsValue) -> Result<String, JsValue> {
        let selections: HashMap<String, String> = serde_wasm_bindgen::from_value(selections)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse selections: {}", e)))?;

        let product = self
            .products
            .get(pid)
            .ok_or_else(|| JsValue::from_str(&format!("Product {} not found", pid)))?;

        if product.variations.is_empty() {
            return Ok(pid.to_string());
        }

        // Build SKU suffix from variation selections
        let mut sku_parts: Vec<String> = vec![];
        for variation in &product.variations {
            if let Some(selected_value) = selections.get(&variation.id) {
                sku_parts.push(selected_value.clone());
            } else {
                return Err(JsValue::from_str(&format!(
                    "Missing selection for variation {}",
                    variation.id
                )));
            }
        }

        let sku = if sku_parts.is_empty() {
            pid.to_string()
        } else {
            format!("{}:{}", pid, sku_parts.join(""))
        };

        Ok(sku)
    }

    /// Check if a SKU is available in inventory
    pub fn check_inventory(&self, sku: &str) -> Result<JsValue, JsValue> {
        // Extract PID from SKU
        let pid = sku.split(':').next().unwrap_or(sku);

        let product = self
            .products
            .get(pid)
            .ok_or_else(|| JsValue::from_str(&format!("Product {} not found", pid)))?;

        if let Some(inventory_item) = product.inventory.get(sku) {
            serde_wasm_bindgen::to_value(&inventory_item)
                .map_err(|e| JsValue::from_str(&format!("Failed to serialize inventory: {}", e)))
        } else {
            Err(JsValue::from_str(&format!(
                "Inventory not found for SKU {}",
                sku
            )))
        }
    }

    /// Get all variations for a product
    pub fn get_variations(&self, pid: &str) -> Result<JsValue, JsValue> {
        let product = self
            .products
            .get(pid)
            .ok_or_else(|| JsValue::from_str(&format!("Product {} not found", pid)))?;

        serde_wasm_bindgen::to_value(&product.variations)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize variations: {}", e)))
    }

    /// Get product attribute
    pub fn get_attribute(&self, pid: &str, attr_name: &str) -> Result<JsValue, JsValue> {
        let product = self
            .products
            .get(pid)
            .ok_or_else(|| JsValue::from_str(&format!("Product {} not found", pid)))?;

        product
            .attribs
            .get(attr_name)
            .ok_or_else(|| {
                JsValue::from_str(&format!("Attribute {} not found for product {}", attr_name, pid))
            })
            .and_then(|v| {
                serde_wasm_bindgen::to_value(v)
                    .map_err(|e| JsValue::from_str(&format!("Failed to serialize attribute: {}", e)))
            })
    }

    /// Calculate final price with variation price modifiers
    pub fn calculate_price(&self, pid: &str, selections: JsValue) -> Result<f64, JsValue> {
        let selections: HashMap<String, String> = serde_wasm_bindgen::from_value(selections)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse selections: {}", e)))?;

        let product = self
            .products
            .get(pid)
            .ok_or_else(|| JsValue::from_str(&format!("Product {} not found", pid)))?;

        // Get base price
        let base_price: f64 = product
            .attribs
            .get("zoovy:base_price")
            .and_then(|v| v.as_str())
            .and_then(|s| s.parse().ok())
            .unwrap_or(0.0);

        let mut final_price = base_price;

        // Add variation price modifiers
        for variation in &product.variations {
            if let Some(selected_value) = selections.get(&variation.id) {
                if let Some(option) = variation.options.iter().find(|o| &o.v == selected_value) {
                    if let Some(price_mod) = option.price_mod {
                        final_price += price_mod;
                    }
                }
            }
        }

        Ok(final_price)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_sku() {
        let mut processor = ProductProcessor::new();

        let product_json = serde_json::json!({
            "pid": "TEST",
            "@variations": [
                {
                    "id": "02",
                    "prompt": "Size",
                    "type": "select",
                    "@options": [
                        { "v": "00", "prompt": "Small" },
                        { "v": "01", "prompt": "Medium" }
                    ]
                }
            ],
            "@inventory": {},
            "%attribs": {
                "zoovy:base_price": "99.99"
            }
        });

        let js_product = serde_wasm_bindgen::to_value(&product_json).unwrap();
        processor.load_product(js_product).unwrap();

        let selections = serde_json::json!({"02": "00"});
        let js_selections = serde_wasm_bindgen::to_value(&selections).unwrap();

        let sku = processor.calculate_sku("TEST", js_selections).unwrap();
        assert_eq!(sku, "TEST:00");
    }
}
