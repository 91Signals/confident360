# Setting Up Auto-Deployment to Cloud Run

This guide will help you set up automatic deployment of your backend to Google Cloud Run whenever you push changes to the `backend/` directory.

## Prerequisites
- Google Cloud Project with billing enabled
- GitHub repository: https://github.com/91Signals/confident360
- Cloud Run API enabled
- Cloud Build API enabled

## Step 1: Create a Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click **Create Service Account**
   - Name: `github-actions-deployer`
   - Description: `Service account for GitHub Actions to deploy to Cloud Run`
5. Click **Create and Continue**
6. Add the following roles:
   - `Cloud Build Editor`
   - `Cloud Run Admin`
   - `Service Account User`
   - `Storage Admin`
7. Click **Continue** then **Done**

## Step 2: Create and Download Service Account Key

1. Click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** format
5. Click **Create** - this will download a JSON file
6. **Keep this file secure** - you'll need it in the next step

## Step 3: Add Secret to GitHub

1. Go to your GitHub repository: https://github.com/91Signals/confident360
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `GCP_SA_KEY`
5. Value: Copy and paste the **entire contents** of the JSON file you downloaded
6. Click **Add secret**

## Step 4: Verify Your cloudbuild.yaml Configuration

Your `cloudbuild.yaml` should already be configured. Make sure it has:
- Correct project ID (it uses `$PROJECT_ID` which is auto-detected)
- Correct region (currently set to `us-central1`)
- Environment variables for your backend

## Step 5: Push Changes to GitHub

Now you can commit and push your changes:

```bash
# Stage your changes (excluding node_modules which should be ignored)
git add .

# Commit your changes
git commit -m "Add auto-deployment workflow for backend"

# Push to GitHub
git push origin main
```

## Step 6: Monitor the Deployment

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. You should see a workflow run starting
4. Click on it to see the deployment progress

## How It Works

The GitHub Actions workflow (`.github/workflows/deploy-backend.yml`) will:
1. Trigger automatically when you push changes to:
   - Any file in the `backend/` directory
   - The `cloudbuild.yaml` file
   - The workflow file itself
2. Authenticate with Google Cloud using the service account key
3. Submit a Cloud Build job that:
   - Builds a Docker image from your backend
   - Pushes it to Google Container Registry
   - Deploys it to Cloud Run

## Testing the Deployment

After the workflow completes:
1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Find your `portfolio-backend` service
3. Click on it to see the service URL
4. Test your API endpoints

## Troubleshooting

### Deployment Fails
- Check the GitHub Actions logs for error messages
- Verify all required GCP APIs are enabled:
  ```bash
  gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
  ```

### Permission Errors
- Make sure the service account has all required roles
- Check that the `GCP_SA_KEY` secret is properly set in GitHub

### Build Errors
- Check your `backend/Dockerfile` for any issues
- Verify all dependencies are listed in `backend/requirements.txt`

## Future Changes

Whenever you make changes to the backend:
1. Make your code changes
2. Commit and push to GitHub:
   ```bash
   git add backend/
   git commit -m "Your change description"
   git push origin main
   ```
3. The deployment will happen automatically!

## Manual Deployment (if needed)

If you need to deploy manually:
```bash
gcloud builds submit --config cloudbuild.yaml .
```
