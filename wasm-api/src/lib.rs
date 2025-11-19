use wasm_bindgen::prelude::*;

pub mod dispatch;
pub mod product;
pub mod cart;
pub mod validation;
pub mod utils;

// Re-export main types
pub use dispatch::*;
pub use product::*;
pub use cart::*;
pub use validation::*;
pub use utils::*;

#[wasm_bindgen(start)]
pub fn init() {
    // Set panic hook for better error messages in browser console
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    utils::log("AnyCommerce WASM module initialized");
}

#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
