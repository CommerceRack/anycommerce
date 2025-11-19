# 🐕 AnyCommerce Vue3 + Rust/WASM E-Commerce Platform

> Modern e-commerce platform for App4.Dog smart pet treat dispensers and table cases, migrated from legacy jQuery to Vue3 with Rust/WASM API layer.

## ✨ Features

- **Modern Frontend**: Vue 3 + TypeScript + Vite for blazing-fast development
- **High-Performance API**: Rust/WebAssembly for compute-intensive operations
- **State Management**: Pinia for reactive state management
- **Type Safety**: Full TypeScript support with strict typing
- **Containerized**: Docker-ready with multi-stage builds
- **Developer-Friendly**: b00t methodology for consistent workflows

## 🏗️ Architecture

```
┌─────────────────┐
│   Vue 3 UI      │  ← Modern reactive components
└────────┬────────┘
         │
┌────────▼────────┐
│  Pinia Stores   │  ← State management
└────────┬────────┘
         │
┌────────▼────────┐
│  Rust/WASM API  │  ← High-performance business logic
└────────┬────────┘
         │
┌────────▼────────┐
│  Backend API    │  ← JSON/REST endpoints
└─────────────────┘
```

### Technology Stack

**Frontend:**
- Vue 3 (Composition API)
- TypeScript
- Pinia (state management)
- Vite (build tool)
- Axios (HTTP client)

**WASM Layer:**
- Rust 1.91+
- wasm-bindgen
- serde (serialization)
- Web APIs integration

**Infrastructure:**
- Docker multi-stage builds
- Nginx (production server)
- Just (build automation)

## 🚀 Quick Start

### Prerequisites

- Rust 1.91+ and Cargo
- Node.js 22+ and npm
- wasm-pack
- just (optional but recommended)
- Docker (for containerized deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd anycommerce

# Install all dependencies
just install

# Or manually:
cd wasm-api && cargo fetch
cd ../frontend-v3 && npm install
```

### Development

```bash
# Start development server (port 3000)
just dev

# Or manually:
cd wasm-api && wasm-pack build --target web --out-dir pkg
cd ../frontend-v3 && npm run dev
```

### Production Build

```bash
# Build everything
just build

# Or build individually:
just build-wasm    # Build Rust/WASM module
just build-frontend # Build Vue3 frontend
```

### Docker Deployment

```bash
# Build and run Docker container
just docker-run

# Access at http://localhost:8000

# Stop container
just docker-stop
```

## 📁 Project Structure

```
anycommerce/
├── .b00t/              # b00t methodology tools and configs
├── frontend-v3/        # Vue3 frontend application
│   ├── src/
│   │   ├── components/ # Vue components (Product, Cart, Checkout)
│   │   ├── stores/     # Pinia state stores
│   │   ├── types/      # TypeScript type definitions
│   │   ├── api/        # API client with WASM integration
│   │   └── main.ts     # Application entry point
│   ├── vite.config.ts  # Vite configuration
│   └── package.json    # Frontend dependencies
├── wasm-api/           # Rust/WASM API layer
│   ├── src/
│   │   ├── dispatch/   # API dispatch queue system
│   │   ├── product/    # Product & variation handling
│   │   ├── cart/       # Cart operations
│   │   ├── validation/ # Form validation
│   │   └── utils/      # Utility functions
│   ├── Cargo.toml      # Rust dependencies
│   └── pkg/            # Built WASM output
├── legacy/             # Original jQuery codebase (reference)
├── Dockerfile          # Multi-stage Docker build
├── justfile            # Build automation recipes
├── API_MIGRATION_PLAN.md # Detailed migration strategy
└── README.md           # This file
```

## 🔧 Available Commands

Run `just` to see all available commands:

```bash
just                # Show all commands
just install        # Install dependencies
just build          # Build WASM + frontend
just dev            # Start dev server
just test-wasm      # Run Rust tests
just docker-run     # Build and run Docker
just clean          # Clean build artifacts
just check-env      # Verify environment setup
```

## 📚 Core Components

### WASM Modules

**DispatchQueue** - API request batching and queue management
```rust
let mut queue = DispatchQueue::new("/jsonapi/");
queue.push(QueueType::Mutable, request);
let batch = queue.get_batch(QueueType::Mutable);
```

**ProductProcessor** - Product variations and SKU calculation
```rust
let processor = ProductProcessor::new();
processor.load_product(product);
let sku = processor.calculate_sku("TEST", selections);
let price = processor.calculate_price("TEST", selections);
```

**CartManager** - Shopping cart operations
```rust
let manager = CartManager::new();
let cart = manager.create_cart(cart_id);
manager.add_item(cart_id, item);
manager.update_item(cart_id, sku, qty);
```

### Vue Stores

**Product Store** (`stores/product.ts`)
- Load and cache products
- Calculate SKUs and prices via WASM
- Manage product variations

**Cart Store** (`stores/cart.ts`)
- Create and manage shopping cart
- Add/update/remove items
- Calculate totals via WASM

## 🔄 Migration from Legacy

This project migrates from a jQuery 1.8.2-based RIA (circa 2014) to modern Vue3 + Rust/WASM:

**Legacy:**
- ~17,914 lines of jQuery JavaScript
- Custom MVC pattern
- Manual DOM manipulation
- No build system
- Custom template language (TLC)

**Modern:**
- Vue 3 Composition API
- TypeScript for type safety
- Rust/WASM for performance
- Vite for fast HMR
- Pinia for state management

See [API_MIGRATION_PLAN.md](./API_MIGRATION_PLAN.md) for detailed migration strategy.

## 🧪 Testing

```bash
# Run Rust/WASM tests
just test-wasm

# Or manually:
cd wasm-api && cargo test
```

## 📦 Deployment

### Docker Production Build

```bash
# Build optimized Docker image
docker build -t anycommerce-v3:latest .

# Run in production
docker run -d -p 80:80 anycommerce-v3:latest
```

### Environment Variables

- `VITE_API_ENDPOINT` - Backend API endpoint (default: `/jsonapi/`)

## 🎯 API Compatibility

The new frontend maintains 1:1 API compatibility with the legacy backend:

**Supported Endpoints:**
- `appProductGet` - Get product details
- `appCartCreate` - Create shopping cart
- `cartDetail` - Get cart details
- `cartItemAppend` - Add item to cart
- `cartItemUpdate` - Update cart item
- `appCategoryList` - List products by category
- `appPublicSearch` - Search products
- And more...

## 🔒 Security

- Input validation via Rust/WASM
- XSS protection through Vue's template system
- CORS headers configured
- Secure cookie handling
- Credit card validation (Luhn algorithm)

## 📈 Performance

**WASM Benefits:**
- Near-native performance for complex calculations
- Reduced JavaScript bundle size
- Efficient product variation processing
- Fast cart calculations

**Vue3 Benefits:**
- Smaller bundle size vs Vue 2
- Faster rendering with Composition API
- Better TypeScript integration

## 🤝 Contributing

This project uses the b00t methodology. See `.b00t/AGENTS.md` for development guidelines.

### Development Workflow

1. Create feature branch
2. Make changes
3. Run tests: `just test-wasm`
4. Build: `just build`
5. Test in Docker: `just docker-run`
6. Commit and push

## 📝 License

[Specify your license here]

## 🔗 Links

- **Frontend Framework**: [Vue 3](https://vuejs.org/)
- **WASM Tooling**: [wasm-bindgen](https://rustwasm.github.io/wasm-bindgen/)
- **Build System**: [just](https://github.com/casey/just)
- **b00t Methodology**: [elasticdotventures/_b00t_](https://github.com/elasticdotventures/_b00t_)

---

**Built with ❤️ using Vue 3, Rust, and WebAssembly**
