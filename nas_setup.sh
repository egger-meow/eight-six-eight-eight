#!/bin/bash
# NAS Environment Setup Script for 86.88 B&B

echo "Starting NAS setup..."

# 1. Install Git if not present (this uses Synology's package manager)
if ! command -v git &> /dev/null; then
    echo "Git not found. Attempting to install via synopkg..."
    sudo synopkg install Git || echo "WARNING: Failed to install Git. Please install 'Git Server' manually from DSM Package Center."
else
    echo "Git is already installed."
fi

# 2. Setup Docker directories
DOCKER_BASE="/volume1/docker/8688bnb"

echo "Creating Docker project directories at $DOCKER_BASE..."
mkdir -p "$DOCKER_BASE"
mkdir -p "$DOCKER_BASE/npm/data"
mkdir -p "$DOCKER_BASE/npm/letsencrypt"
mkdir -p "$DOCKER_BASE/website"

# 3. Create docker-compose.yml
echo "Generating docker-compose.yml..."
cat << 'EOF' > "$DOCKER_BASE/docker-compose.yml"
version: '3.8'

services:
  # Nginx Proxy Manager (Reverse Proxy)
  nginx-proxy-manager:
    image: 'jc21/nginx-proxy-manager:latest'
    container_name: npm
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
      - '81:81' # Admin GUI
    volumes:
      - ./npm/data:/data
      - ./npm/letsencrypt:/etc/letsencrypt

  # Cloudflare Tunnel (Replace YOUR_TOKEN_HERE with the actual token later)
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=YOUR_TOKEN_HERE

  # Next.js Website Placeholder
  website:
    image: node:18-alpine
    container_name: website
    restart: unless-stopped
    working_dir: /app
    volumes:
      - ./website:/app
    # We will build/start Next.js manually or via a CI script later
    command: sh -c "echo 'Next.js placeholder container running' && tail -f /dev/null"
    ports:
      - '3000:3000'

networks:
  default:
    name: 8688bnb_net
EOF

echo "Done! Run 'cd $DOCKER_BASE' to go to your project folder."
