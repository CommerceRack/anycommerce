# Multi-stage build for AnyCommerce Vue3 + Rust/WASM

# Stage 1: Build Rust/WASM module
FROM rust:1.91 AS wasm-builder

# Install wasm-pack
RUN cargo install wasm-pack

# Set working directory
WORKDIR /build

# Copy WASM source
COPY wasm-api /build/wasm-api

# Build WASM module
WORKDIR /build/wasm-api
RUN rustup target add wasm32-unknown-unknown && \
    wasm-pack build --target web --out-dir pkg

# Stage 2: Build Vue3 frontend
FROM node:22-alpine AS frontend-builder

# Set working directory
WORKDIR /build

# Copy package files
COPY frontend-v3/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source and WASM output
COPY frontend-v3 ./
COPY --from=wasm-builder /build/wasm-api/pkg ./node_modules/@wasm/

# Build frontend
RUN npm run build

# Stage 3: Production nginx server
FROM nginx:alpine

# Copy built frontend
COPY --from=frontend-builder /build/dist /usr/share/nginx/html

# Copy nginx configuration
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json application/wasm;

    # WASM MIME type
    types {
        application/wasm wasm;
    }

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy (configure based on your backend)
    location /jsonapi/ {
        proxy_pass http://backend:8080/jsonapi/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
