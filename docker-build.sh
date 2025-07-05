#!/bin/bash

# Docker build and push script for x-decode
# Usage: ./docker-build.sh <tag>
# Example: ./docker-build.sh 0.2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REPO="geomena/x-decode"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if tag is provided
if [ -z "$1" ]; then
    print_error "Please provide a tag version"
    echo "Usage: $0 <tag>"
    echo "Example: $0 0.2"
    exit 1
fi

TAG="$1"

# Validate tag format (simple check)
if [[ ! $TAG =~ ^[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$ ]]; then
    print_warning "Tag format should be like: 0.2, 1.0, 0.2-beta"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_status "Starting Docker build and push process for tag: $TAG"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if logged in to Docker Hub
if ! docker system info | grep -q "Username:"; then
    print_warning "You don't appear to be logged in to Docker Hub"
    print_status "Attempting to login..."
    docker login
fi

# Build the Docker image
print_status "Building Docker image..."
docker build -t "${DOCKER_REPO}:${TAG}" -t "${DOCKER_REPO}:latest" .

if [ $? -eq 0 ]; then
    print_status "✓ Docker image built successfully"
else
    print_error "✗ Docker build failed"
    exit 1
fi

# Push the tagged version
print_status "Pushing tagged version (${TAG})..."
docker push "${DOCKER_REPO}:${TAG}"

if [ $? -eq 0 ]; then
    print_status "✓ Tagged version pushed successfully"
else
    print_error "✗ Failed to push tagged version"
    exit 1
fi

# Push the latest version
print_status "Pushing latest version..."
docker push "${DOCKER_REPO}:latest"

if [ $? -eq 0 ]; then
    print_status "✓ Latest version pushed successfully"
else
    print_error "✗ Failed to push latest version"
    exit 1
fi

print_status "🎉 Successfully built and pushed:"
echo "  • ${DOCKER_REPO}:${TAG}"
echo "  • ${DOCKER_REPO}:latest"
echo ""
print_status "You can now run the container with:"
echo "  docker run -p 3000:3000 ${DOCKER_REPO}:${TAG}"
echo "  or"
echo "  docker run -p 3000:3000 ${DOCKER_REPO}:latest"