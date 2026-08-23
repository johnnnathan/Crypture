# ==========================================
# Stage 1: Build WASM & Engine Assets
# ==========================================
# Use rust:latest (or rust:nightly-slim if using nightly 2024 edition features)
FROM rust:latest as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Add Wasm target
RUN rustup target add wasm32-unknown-unknown

# Install wasm-pack
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Set working directory
WORKDIR /app

# Copy repository source files
COPY . .

# Ensure build tools are executable
RUN chmod +x tools/*.sh

# Run setup to build WASM and Engine packages
RUN ./tools/setup.sh


# ==========================================
# Stage 2: Serve Frontend via Nginx
# ==========================================
FROM nginx:alpine

# Copy built frontend assets (including compiled WASM/PKGs)
COPY --from=builder /app/frontend/app/ /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
