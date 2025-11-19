# AnyCommerce Vue3 + Rust/WASM Build System
# Using b00t methodology

# Default recipe - show available commands
default:
    @just --list

# Install all dependencies
install: install-wasm install-frontend

# Install Rust/WASM dependencies
install-wasm:
    @echo "📦 Installing Rust/WASM dependencies..."
    cd wasm-api && cargo fetch
    @which wasm-pack || cargo install wasm-pack
    @rustup target list --installed | grep -q wasm32-unknown-unknown || rustup target add wasm32-unknown-unknown

# Install frontend dependencies
install-frontend:
    @echo "📦 Installing frontend dependencies..."
    cd frontend-v3 && npm install

# Build WASM module
build-wasm:
    @echo "🦀 Building Rust/WASM module..."
    cd wasm-api && wasm-pack build --target web --out-dir pkg

# Build frontend
build-frontend: build-wasm
    @echo "⚡ Building Vue3 frontend..."
    cd frontend-v3 && npm run build

# Build everything
build: build-wasm build-frontend
    @echo "✅ Build complete!"

# Run WASM tests
test-wasm:
    @echo "🧪 Running Rust/WASM tests..."
    cd wasm-api && cargo test

# Run frontend in development mode
dev:
    @echo "🚀 Starting development server..."
    @echo "Backend proxy configured for http://localhost:8080/jsonapi/"
    cd frontend-v3 && npm run dev

# Build and run Docker container
docker-build:
    @echo "🐳 Building Docker image..."
    docker build -t anycommerce-v3:latest .

# Run Docker container
docker-run: docker-build
    @echo "🐳 Running Docker container..."
    docker run -d -p 8000:80 --name anycommerce-v3 anycommerce-v3:latest
    @echo "✅ Container running at http://localhost:8000"

# Stop Docker container
docker-stop:
    @echo "🛑 Stopping Docker container..."
    docker stop anycommerce-v3 || true
    docker rm anycommerce-v3 || true

# Clean build artifacts
clean:
    @echo "🧹 Cleaning build artifacts..."
    cd wasm-api && cargo clean
    cd frontend-v3 && rm -rf dist node_modules
    @echo "✅ Clean complete!"

# Format Rust code
fmt-rust:
    @echo "🎨 Formatting Rust code..."
    cd wasm-api && cargo fmt

# Format frontend code
fmt-frontend:
    @echo "🎨 Formatting frontend code..."
    cd frontend-v3 && npm run format || npx prettier --write "src/**/*.{ts,vue,js}"

# Lint Rust code
lint-rust:
    @echo "🔍 Linting Rust code..."
    cd wasm-api && cargo clippy -- -D warnings

# Run all checks
check: test-wasm lint-rust
    @echo "✅ All checks passed!"

# Full rebuild from scratch
rebuild: clean install build
    @echo "✅ Rebuild complete!"

# Deploy to production (customize for your deployment)
deploy: build docker-build
    @echo "🚀 Deploying to production..."
    @echo "⚠️  Customize this recipe for your deployment target"

# Show WASM package info
wasm-info:
    @echo "📦 WASM Package Info:"
    @ls -lh wasm-api/pkg/*.wasm || echo "WASM not built yet. Run: just build-wasm"

# Show project structure
tree:
    @echo "📂 Project Structure:"
    tree -L 3 -I 'node_modules|target|dist|pkg'

# Generate documentation
docs:
    @echo "📚 Generating documentation..."
    cd wasm-api && cargo doc --no-deps --open

# b00t integration - Learn about project
[group('b00t')]
learn-project:
    @echo "🥾 AnyCommerce Project Overview"
    @echo ""
    @echo "Technology Stack:"
    @echo "  • Frontend: Vue 3 + TypeScript + Vite"
    @echo "  • API Layer: Rust + WebAssembly"
    @echo "  • State Management: Pinia"
    @echo "  • Containerization: Docker + nginx"
    @echo ""
    @echo "Key Directories:"
    @echo "  • frontend-v3/    - Vue3 frontend application"
    @echo "  • wasm-api/       - Rust/WASM API layer"
    @echo "  • legacy/         - Original jQuery codebase (reference)"
    @echo "  • .b00t/          - b00t methodology tools"
    @echo ""
    @echo "Quick Start:"
    @echo "  just install      - Install all dependencies"
    @echo "  just build        - Build WASM + frontend"
    @echo "  just dev          - Run development server"
    @echo "  just docker-run   - Build and run in Docker"

# b00t integration - Check environment
[group('b00t')]
check-env:
    @echo "🔍 Checking development environment..."
    @echo ""
    @echo "Rust toolchain:"
    @rustc --version || echo "❌ Rust not installed"
    @cargo --version || echo "❌ Cargo not installed"
    @echo ""
    @echo "Node.js:"
    @node --version || echo "❌ Node.js not installed"
    @npm --version || echo "❌ npm not installed"
    @echo ""
    @echo "WASM tools:"
    @wasm-pack --version || echo "❌ wasm-pack not installed (run: cargo install wasm-pack)"
    @echo ""
    @echo "Container tools:"
    @docker --version || echo "❌ Docker not installed"

# Development workflow - quick iteration
[group('dev')]
watch-wasm:
    @echo "👀 Watching WASM for changes..."
    watchexec -w wasm-api/src -e rs 'just build-wasm'

# Generate performance report
[group('dev')]
perf-report:
    @echo "📊 Generating performance report..."
    @echo "WASM binary size:"
    @ls -lh wasm-api/pkg/*.wasm 2>/dev/null || echo "Build WASM first"
    @echo ""
    @echo "Frontend bundle size:"
    @du -sh frontend-v3/dist 2>/dev/null || echo "Build frontend first"

# Initialize project from scratch (first-time setup)
init: install build
    @echo "🎉 Project initialized successfully!"
    @echo ""
    @echo "Next steps:"
    @echo "  1. Review the API_MIGRATION_PLAN.md"
    @echo "  2. Start development: just dev"
    @echo "  3. Or run in Docker: just docker-run"
