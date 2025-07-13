# Docker Deployment Guide

## Overview

This guide explains how to build and deploy the x-decode application using Docker containers. The project includes an automated build script that handles the entire process from building the image to pushing it to Docker Hub.

## Prerequisites

- Docker installed and running on your machine
- Docker Hub account with access to the `geomena/x-decode` repository
- Logged in to Docker Hub (`docker login`)

## Quick Start

### Building and Pushing a New Version

Use the provided build script to create and push a new Docker image:

```bash
./docker-build.sh <version-tag>
```

### Example Usage

```bash
# Build and push version 0.2 (current beta)
./docker-build.sh 0.2

# Build and push version 1.0 (stable release)
./docker-build.sh 1.0

# Build and push a beta version
./docker-build.sh 0.3-beta
```

## What the Script Does

The `docker-build.sh` script automatically:

1. **Validates** the provided version tag format
2. **Checks** if Docker is running
3. **Verifies** Docker Hub authentication
4. **Builds** the Docker image with multi-stage optimization
5. **Tags** the image with both the specific version and `latest`
6. **Pushes** both tags to Docker Hub
7. **Provides** run commands for the new image

## Running the Container

After a successful build and push, you can run the container:

```bash
# Run the specific version
docker run -p 3000:3000 geomena/x-decode:0.2

# Run the latest version
docker run -p 3000:3000 geomena/x-decode:latest

# Run in detached mode
docker run -d -p 3000:3000 --name x-decode geomena/x-decode:0.2
```

The application will be available at `http://localhost:3000`

## Docker Image Details

### Multi-Stage Build Process

The Dockerfile uses a multi-stage build approach:

1. **Base Stage**: Node.js 18 Alpine base image
2. **Dependencies Stage**: Installs npm dependencies
3. **Builder Stage**: Builds the Next.js application
4. **Runner Stage**: Creates the final optimized image

### Image Optimization

- Uses Alpine Linux for smaller image size
- Implements proper user permissions (non-root)
- Standalone output for optimal container size
- Disabled telemetry and Sentry for production builds

## Troubleshooting

### Common Issues

1. **Docker not running**

    ```bash
    # Start Docker Desktop or Docker daemon
    ```

2. **Authentication failed**

    ```bash
    docker login
    ```

3. **Build fails**
    ```bash
    # Check Docker logs
    docker logs <container-id>
    ```

### Build Script Permissions

If the script is not executable:

```bash
chmod +x docker-build.sh
```

## Version Tagging Strategy

### Current Beta Phase (0.x)

- Use `0.x` format for beta versions
- Example: `0.2`, `0.3`, `0.4-beta`
- Moving towards stable `1.0` release

### Stable Release (1.x+)

- Use semantic versioning: `MAJOR.MINOR.PATCH`
- Example: `1.0.0`, `1.1.0`, `1.0.1`

## Docker Hub Repository

- Repository: `geomena/x-decode`
- Tags: Version-specific tags + `latest`
- Visibility: Public

## Additional Commands

```bash
# View local images
docker images geomena/x-decode

# Remove local image
docker rmi geomena/x-decode:0.2

# View running containers
docker ps

# Stop container
docker stop <container-name>

# View container logs
docker logs <container-name>
```

---

_This documentation is for the x-decode project Docker deployment process._
