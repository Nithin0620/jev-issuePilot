#!/usr/bin/env bash
set -e

# IssuePilot Google Cloud Run Deployment Script
# Usage: ./scripts/deploy.sh <PROJECT_ID> [REGION]

PROJECT_ID=$1
REGION=${2:-"asia-south1"}

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: Project ID is required."
  echo "Usage: ./scripts/deploy.sh <PROJECT_ID> [REGION]"
  exit 1
fi

echo "🚀 Deploying IssuePilot to Google Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region:  $REGION"

# Set Project
gcloud config set project "$PROJECT_ID"

# Enable Required GCP Services
echo "📦 Enabling GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

# Create Artifact Registry if needed
echo "📦 Ensuring Artifact Registry repository exists..."
gcloud artifacts repositories create issuepilot \
  --repository-format=docker \
  --location="$REGION" || true

IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/issuepilot/app:latest"

# Build Image with Cloud Build
echo "🔨 Building Docker image using Cloud Build..."
gcloud builds submit --tag "$IMAGE_TAG"

# Deploy to Cloud Run
echo "🚢 Deploying container to Cloud Run..."
gcloud run deploy issuepilot \
  --image "$IMAGE_TAG" \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets="TYPESAFE_API_KEY=issuepilot-jev-key:latest,DATABASE_URL=issuepilot-database-url:latest,NEXTAUTH_SECRET=issuepilot-auth-secret:latest"

echo "✅ IssuePilot deployed successfully to Cloud Run!"
