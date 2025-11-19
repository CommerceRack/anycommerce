# API Migration Plan: JavaScript → Rust/WASM + Vue3

## Overview
Migrating anycommerce from jQuery-based RIA to Vue3 frontend with Rust/WASM API layer.

## Key API Interfaces to Implement in Rust/WASM

### 1. **Dispatch Queue System** (High Priority - Core Infrastructure)
**Current:** `model.js` - 3-queue system (mutable, immutable, passive)
**Target:** Rust/WASM module for API request batching and management

```rust
// Core types
pub struct ApiRequest {
    cmd: String,
    params: serde_json::Value,
    tag: Option<RequestTag>,
}

pub struct RequestTag {
    datapointer: String,
    callback: Option<String>,
}

pub enum QueueType {
    Mutable,    // Standard requests, can be aborted
    Immutable,  // Mission-critical (cart, checkout) - serial execution
    Passive,    // Fire-and-forget
}
```

**WASM Exports:**
- `dispatch(queue_type, request)` - Queue API request
- `abort_queue(queue_type)` - Abort mutable queue
- `process_responses(json)` - Process API batch response

### 2. **Product Variations & POG (Product Option Groups)** (High Priority)
**Current:** `includes.js` - handlePogs() function (complex logic)
**Target:** Rust/WASM for performance-critical variation processing

```rust
pub struct Variation {
    id: String,
    prompt: String,
    variation_type: String,
    options: Vec<VariationOption>,
}

pub struct VariationOption {
    v: String,
    prompt: String,
    price_mod: Option<f64>,
}
```

**WASM Exports:**
- `process_variations(product_json)` - Parse and validate variations
- `calculate_sku(base_sku, selections)` - Generate SKU from selections
- `get_available_inventory(sku)` - Check inventory availability

### 3. **Cart Operations** (High Priority)
**Current:** `cart_checkout_order.js` - 1,424 lines
**Target:** Rust/WASM for cart state management and calculations

```rust
pub struct Cart {
    cart_id: String,
    items: Vec<CartItem>,
    summary: CartSummary,
    want: CheckoutPreferences,
}

pub struct CartSummary {
    items_total: f64,
    shipping_total: f64,
    tax_total: f64,
    balance_due: f64,
}
```

**WASM Exports:**
- `cart_add_item(cart, sku, qty)` - Add item to cart
- `cart_update_item(cart, stid, qty)` - Update item quantity
- `cart_calculate_totals(cart)` - Recalculate cart totals
- `cart_apply_coupon(cart, code)` - Apply coupon code

### 4. **Data Validation & Form Processing** (Medium Priority)
**Current:** Various validation scattered across extensions
**Target:** Centralized Rust/WASM validation

```rust
pub struct ValidationRule {
    field: String,
    rule_type: ValidationType,
    params: Option<serde_json::Value>,
}

pub enum ValidationType {
    Required,
    Email,
    Phone,
    ZipCode,
    CreditCard,
    Custom(String),
}
```

**WASM Exports:**
- `validate_field(field, value, rules)` - Validate single field
- `validate_form(form_data, schema)` - Validate entire form
- `format_validation_errors(errors)` - Format errors for display

### 5. **Search & Filtering** (Medium Priority)
**Current:** `store_search.js` - 561 lines
**Target:** Rust/WASM for efficient client-side filtering

**WASM Exports:**
- `filter_products(products, criteria)` - Filter product list
- `search_products(products, query)` - Search products
- `sort_products(products, sort_by)` - Sort product list

### 6. **Image Processing** (Lower Priority - Enhancement)
**Current:** JavaScript-based image loading
**Target:** Rust/WASM for image optimization

**WASM Exports:**
- `optimize_image(image_data)` - Compress/resize images
- `generate_thumbnail(image_data, size)` - Generate thumbnails

## Project Structure

```
anycommerce/
├── .b00t/                    # b00t methodology submodule
├── legacy/                   # Original jQuery codebase (reference)
│   ├── app-quickstart.html
│   ├── app-quickstart.js
│   ├── controller.js
│   ├── model.js
│   └── extensions/
├── frontend-v3/              # Vue3 frontend (NEW)
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── router/
│   │   ├── stores/          # Pinia state management
│   │   ├── components/
│   │   │   ├── Product/
│   │   │   ├── Cart/
│   │   │   ├── Checkout/
│   │   │   └── Common/
│   │   ├── composables/     # Vue composables
│   │   ├── types/           # TypeScript types
│   │   └── assets/
│   ├── public/
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
├── wasm-api/                 # Rust/WASM API layer (NEW)
│   ├── src/
│   │   ├── lib.rs
│   │   ├── dispatch/        # Dispatch queue system
│   │   ├── product/         # Product & variations
│   │   ├── cart/            # Cart operations
│   │   ├── validation/      # Form validation
│   │   └── utils/
│   ├── Cargo.toml
│   └── pkg/                 # WASM build output
├── Dockerfile               # Container configuration
├── justfile                 # Build & deployment recipes
└── README.md
```

## API Endpoints (1:1 Mapping)

### Product APIs
- `appProductGet` - Get product details with variations
- `appReviewsList` - Get product reviews
- `appCategoryList` - List category products
- `appPublicSearch` - Search products

### Cart APIs
- `appCartCreate` - Create new cart
- `cartDetail` - Get cart details
- `cartItemAppend` - Add item to cart
- `cartItemUpdate` - Update cart item
- `cartItemRemove` - Remove cart item
- `cartCouponAdd` - Apply coupon
- `cartShippingUpdate` - Update shipping method

### Checkout APIs
- `appCheckoutDestinations` - Get shipping destinations
- `appPaymentMethods` - Get payment methods
- `pipeline` - Submit order

### Customer APIs
- `appBuyerLogin` - Customer login
- `buyerUpdate` - Update customer info
- `buyerAddressList` - List customer addresses

## Migration Strategy

### Phase 1: Infrastructure (Current)
- ✅ Set up b00t methodology
- ✅ Install Rust/WASM tooling
- ⏳ Create project structure
- ⏳ Set up Vue3 with Vite

### Phase 2: Core WASM Modules
- Implement dispatch queue system
- Implement product variations/POG
- Implement cart operations
- Implement validation

### Phase 3: Vue3 Components
- Create base components
- Implement product display
- Implement cart UI
- Implement checkout flow

### Phase 4: Integration
- Wire WASM to Vue3
- Test API compatibility
- Ensure 1:1 feature parity

### Phase 5: Containerization
- Create Dockerfile
- Set up justfile
- Configure deployment

## Data Structure Modernization

### Current: Custom TLC Templates
```html
<!-- bindto="appProductGet|SKU" -->
<div data-bind="prod_name"></div>
```

### Target: Vue3 Templates
```vue
<template>
  <div>{{ product.prod_name }}</div>
</template>
```

### State Management

**Current:** Global `_app.data` object
**Target:** Pinia stores

```typescript
// stores/product.ts
export const useProductStore = defineStore('product', {
  state: () => ({
    products: new Map(),
    currentProduct: null,
  }),
  actions: {
    async fetchProduct(pid: string) {
      // WASM API call
    }
  }
})
```

## Performance Targets

- Initial load: < 2s
- WASM initialization: < 100ms
- Cart operations: < 50ms
- Product variation calculation: < 20ms

## Notes

- Keep markdown support (backend being rewritten in Rust)
- No XML data structures found (already JSON-based ✅)
- Focus on 1:1 feature parity for early integration test
- Use modern data structures (Maps, Sets) instead of plain objects
- Leverage TypeScript for type safety
