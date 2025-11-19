use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum QueueType {
    Mutable,   // Standard requests, can be aborted
    Immutable, // Mission-critical (cart, checkout) - serial execution
    Passive,   // Fire-and-forget, never aborted
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestTag {
    pub datapointer: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub callback: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extension: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiRequest {
    #[serde(rename = "_cmd")]
    pub cmd: String,
    #[serde(flatten)]
    pub params: HashMap<String, serde_json::Value>,
    #[serde(rename = "_tag", skip_serializing_if = "Option::is_none")]
    pub tag: Option<RequestTag>,
}

#[wasm_bindgen]
pub struct DispatchQueue {
    mutable_queue: VecDeque<ApiRequest>,
    immutable_queue: VecDeque<ApiRequest>,
    passive_queue: VecDeque<ApiRequest>,
    endpoint: String,
}

#[wasm_bindgen]
impl DispatchQueue {
    #[wasm_bindgen(constructor)]
    pub fn new(endpoint: String) -> DispatchQueue {
        DispatchQueue {
            mutable_queue: VecDeque::new(),
            immutable_queue: VecDeque::new(),
            passive_queue: VecDeque::new(),
            endpoint,
        }
    }

    /// Add a request to the specified queue
    pub fn push(&mut self, queue_type: QueueType, request: JsValue) -> Result<(), JsValue> {
        let request: ApiRequest = serde_wasm_bindgen::from_value(request)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse request: {}", e)))?;

        match queue_type {
            QueueType::Mutable => self.mutable_queue.push_back(request),
            QueueType::Immutable => self.immutable_queue.push_back(request),
            QueueType::Passive => self.passive_queue.push_back(request),
        }

        Ok(())
    }

    /// Get the current length of a queue
    pub fn length(&self, queue_type: QueueType) -> usize {
        match queue_type {
            QueueType::Mutable => self.mutable_queue.len(),
            QueueType::Immutable => self.immutable_queue.len(),
            QueueType::Passive => self.passive_queue.len(),
        }
    }

    /// Clear a specific queue (abort)
    pub fn abort(&mut self, queue_type: QueueType) -> usize {
        let len = match queue_type {
            QueueType::Mutable => {
                let len = self.mutable_queue.len();
                self.mutable_queue.clear();
                len
            }
            QueueType::Immutable => 0, // Cannot abort immutable queue
            QueueType::Passive => 0,   // Cannot abort passive queue
        };
        len
    }

    /// Get all requests from a queue for batching
    pub fn get_batch(&mut self, queue_type: QueueType) -> Result<JsValue, JsValue> {
        let batch: Vec<ApiRequest> = match queue_type {
            QueueType::Mutable => self.mutable_queue.drain(..).collect(),
            QueueType::Immutable => {
                // Immutable queue processes one at a time
                if let Some(req) = self.immutable_queue.pop_front() {
                    vec![req]
                } else {
                    vec![]
                }
            }
            QueueType::Passive => self.passive_queue.drain(..).collect(),
        };

        serde_wasm_bindgen::to_value(&batch)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize batch: {}", e)))
    }

    /// Get the API endpoint
    pub fn get_endpoint(&self) -> String {
        self.endpoint.clone()
    }

    /// Check if any queue has pending requests
    pub fn has_pending(&self) -> bool {
        !self.mutable_queue.is_empty()
            || !self.immutable_queue.is_empty()
            || !self.passive_queue.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_queue_push_and_length() {
        let mut queue = DispatchQueue::new("/jsonapi/".to_string());

        let mut params = HashMap::new();
        params.insert("pid".to_string(), serde_json::json!("TEST"));

        let request = ApiRequest {
            cmd: "appProductGet".to_string(),
            params,
            tag: None,
        };

        let js_request = serde_wasm_bindgen::to_value(&request).unwrap();
        queue.push(QueueType::Mutable, js_request).unwrap();

        assert_eq!(queue.length(QueueType::Mutable), 1);
        assert_eq!(queue.length(QueueType::Immutable), 0);
    }
}
