use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CartItem {
    pub sku: String,
    pub pid: String,
    pub prod_name: String,
    pub qty: u32,
    pub base_price: f64,
    pub price: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variations: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CartSummary {
    pub items_total: f64,
    pub shipping_total: f64,
    pub tax_total: f64,
    pub discount_total: f64,
    pub balance_due: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckoutPreferences {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shipping_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payby: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cart {
    pub cart_id: String,
    #[serde(rename = "@ITEMS")]
    pub items: Vec<CartItem>,
    pub sum: CartSummary,
    pub want: CheckoutPreferences,
    #[serde(default)]
    pub coupons: Vec<String>,
}

#[wasm_bindgen]
pub struct CartManager {
    carts: HashMap<String, Cart>,
}

#[wasm_bindgen]
impl CartManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> CartManager {
        CartManager {
            carts: HashMap::new(),
        }
    }

    /// Create a new cart
    pub fn create_cart(&mut self, cart_id: String) -> Result<JsValue, JsValue> {
        let cart = Cart {
            cart_id: cart_id.clone(),
            items: vec![],
            sum: CartSummary {
                items_total: 0.0,
                shipping_total: 0.0,
                tax_total: 0.0,
                discount_total: 0.0,
                balance_due: 0.0,
            },
            want: CheckoutPreferences {
                shipping_id: None,
                payby: None,
            },
            coupons: vec![],
        };

        self.carts.insert(cart_id.clone(), cart.clone());

        serde_wasm_bindgen::to_value(&cart)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize cart: {}", e)))
    }

    /// Load a cart from JSON (from API response)
    pub fn load_cart(&mut self, cart_json: JsValue) -> Result<String, JsValue> {
        let cart: Cart = serde_wasm_bindgen::from_value(cart_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse cart: {}", e)))?;

        let cart_id = cart.cart_id.clone();
        self.carts.insert(cart_id.clone(), cart);

        Ok(cart_id)
    }

    /// Get a cart by ID
    pub fn get_cart(&self, cart_id: &str) -> Result<JsValue, JsValue> {
        let cart = self
            .carts
            .get(cart_id)
            .ok_or_else(|| JsValue::from_str(&format!("Cart {} not found", cart_id)))?;

        serde_wasm_bindgen::to_value(cart)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize cart: {}", e)))
    }

    /// Add an item to the cart
    pub fn add_item(&mut self, cart_id: &str, item: JsValue) -> Result<JsValue, JsValue> {
        let cart = self
            .carts
            .get_mut(cart_id)
            .ok_or_else(|| JsValue::from_str(&format!("Cart {} not found", cart_id)))?;

        let item: CartItem = serde_wasm_bindgen::from_value(item)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse item: {}", e)))?;

        // Check if item already exists (same SKU)
        if let Some(existing) = cart.items.iter_mut().find(|i| i.sku == item.sku) {
            existing.qty += item.qty;
        } else {
            cart.items.push(item);
        }

        self.recalculate_totals(cart_id)?;

        self.get_cart(cart_id)
    }

    /// Update item quantity
    pub fn update_item(&mut self, cart_id: &str, sku: &str, qty: u32) -> Result<JsValue, JsValue> {
        let cart = self
            .carts
            .get_mut(cart_id)
            .ok_or_else(|| JsValue::from_str(&format!("Cart {} not found", cart_id)))?;

        let item = cart
            .items
            .iter_mut()
            .find(|i| i.sku == sku)
            .ok_or_else(|| JsValue::from_str(&format!("Item {} not found in cart", sku)))?;

        if qty == 0 {
            // Remove item if quantity is 0
            cart.items.retain(|i| i.sku != sku);
        } else {
            item.qty = qty;
        }

        self.recalculate_totals(cart_id)?;

        self.get_cart(cart_id)
    }

    /// Remove an item from the cart
    pub fn remove_item(&mut self, cart_id: &str, sku: &str) -> Result<JsValue, JsValue> {
        let cart = self
            .carts
            .get_mut(cart_id)
            .ok_or_else(|| JsValue::from_str(&format!("Cart {} not found", cart_id)))?;

        cart.items.retain(|i| i.sku != sku);

        self.recalculate_totals(cart_id)?;

        self.get_cart(cart_id)
    }

    /// Add a coupon code
    pub fn add_coupon(&mut self, cart_id: &str, coupon: String) -> Result<JsValue, JsValue> {
        let cart = self
            .carts
            .get_mut(cart_id)
            .ok_or_else(|| JsValue::from_str(&format!("Cart {} not found", cart_id)))?;

        if !cart.coupons.contains(&coupon) {
            cart.coupons.push(coupon);
        }

        // Note: Actual coupon calculation would be done server-side
        // This is just for tracking

        self.get_cart(cart_id)
    }

    /// Calculate cart totals
    pub fn recalculate_totals(&mut self, cart_id: &str) -> Result<(), JsValue> {
        let cart = self
            .carts
            .get_mut(cart_id)
            .ok_or_else(|| JsValue::from_str(&format!("Cart {} not found", cart_id)))?;

        let items_total: f64 = cart.items.iter().map(|item| item.price * item.qty as f64).sum();

        cart.sum.items_total = items_total;
        cart.sum.balance_due =
            items_total + cart.sum.shipping_total + cart.sum.tax_total - cart.sum.discount_total;

        Ok(())
    }

    /// Get cart item count
    pub fn get_item_count(&self, cart_id: &str) -> Result<u32, JsValue> {
        let cart = self
            .carts
            .get(cart_id)
            .ok_or_else(|| JsValue::from_str(&format!("Cart {} not found", cart_id)))?;

        Ok(cart.items.iter().map(|item| item.qty).sum())
    }

    /// Clear cart
    pub fn clear_cart(&mut self, cart_id: &str) -> Result<JsValue, JsValue> {
        let cart = self
            .carts
            .get_mut(cart_id)
            .ok_or_else(|| JsValue::from_str(&format!("Cart {} not found", cart_id)))?;

        cart.items.clear();
        cart.coupons.clear();
        cart.sum = CartSummary {
            items_total: 0.0,
            shipping_total: 0.0,
            tax_total: 0.0,
            discount_total: 0.0,
            balance_due: 0.0,
        };

        self.get_cart(cart_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cart_operations() {
        let mut manager = CartManager::new();

        // Create cart
        let cart_id = "TEST_CART".to_string();
        manager.create_cart(cart_id.clone()).unwrap();

        // Add item
        let item = CartItem {
            sku: "TEST:00".to_string(),
            pid: "TEST".to_string(),
            prod_name: "Test Product".to_string(),
            qty: 1,
            base_price: 99.99,
            price: 99.99,
            variations: None,
        };

        let js_item = serde_wasm_bindgen::to_value(&item).unwrap();
        manager.add_item(&cart_id, js_item).unwrap();

        // Check item count
        assert_eq!(manager.get_item_count(&cart_id).unwrap(), 1);
    }
}
