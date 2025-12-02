# Deploying this project to Firebase Hosting + Cloud Run

This repository contains a static frontend (frontend/) and a Flask backend (backend/). The recommended setup is:

- Host the static frontend files with Firebase Hosting.
- Run the Flask backend on Cloud Run and configure Firebase Hosting rewrites so API routes are forwarded to the Cloud Run service.

Required tools
- Firebase CLI: https://firebase.google.com/docs/cli
- gcloud SDK: https://cloud.google.com/sdk/docs/install

High-level steps
1. Create a GCP project and enable APIs:

```bash
# replace PROJECT_ID with your GCP project id
gcloud config set project PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

2. Install and log in to Firebase CLI and link project:

```bash
firebase login
firebase projects:list
firebase use --add
```

3. Build & deploy backend to Cloud Run (recommended using Cloud Build):

```bash
# This will run the steps in cloudbuild.yaml which builds the Docker image and deploys to Cloud Run
gcloud builds submit --config cloudbuild.yaml .
# OR
gcloud builds submit --tag gcr.io/$PROJECT_ID/portfolio-backend .
gcloud run deploy portfolio-backend --image gcr.io/$PROJECT_ID/portfolio-backend --region us-central1 --platform managed --allow-unauthenticated
```

4. Set your Firebase Hosting rewrites to point to the Cloud Run service name (see `firebase.json`). If you used a different Cloud Run service name or region, update `firebase.json` accordingly.

5. Deploy Firebase Hosting (static frontend):

```bash
firebase deploy --only hosting
```

6. Test end-to-end:
- Visit your Firebase Hosting URL (printed after deployment). Submitting the Analyze form should hit the Cloud Run backend and return results.

Persistent storage (Cloud Storage) setup
-------------------------------------

This project supports storing generated reports and screenshots in a Google Cloud Storage bucket. To enable this in your Cloud Run deployment, follow these steps:

1. Create a bucket (example):

```bash
gsutil mb -p $PROJECT_ID -l us-central1 gs://portfolio-reports-confi360
```

2. Grant the Cloud Run service account permission to read/write objects in the bucket. First find the service account your Cloud Run service uses:

```bash
# This prints the service account name used by the Cloud Run service
gcloud run services describe portfolio-backend --region us-central1 --format="value(spec.template.spec.serviceAccountName)"
```

Then grant the role (replace SERVICE_ACCOUNT with the value you got above):

```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
	--member=serviceAccount:SERVICE_ACCOUNT \
	--role=roles/storage.objectAdmin
```

3. Set the bucket name as an environment variable in Cloud Run (recommended) when deploying:

```bash
gcloud run deploy portfolio-backend \
	--image gcr.io/$PROJECT_ID/portfolio-backend:$SHORT_SHA \
	--region us-central1 --platform managed --allow-unauthenticated \
	--update-env-vars BUCKET_NAME=portfolio-reports-confi360
```

Note: If you don't set BUCKET_NAME in Cloud Run, the app will default to the bucket name hard-coded in `backend/app.py` (for backward-compat).

Security note
-------------
- The sample backend currently makes uploaded objects public with `blob.make_public()` so the frontend can display screenshots via simple URLs. If you'd prefer to keep objects private, remove `make_public()` and generate signed URLs to send to the client instead (the `google-cloud-storage` library supports that).


Local testing
- To run backend locally: `python backend/app.py` (opens on port 5000).
- To run frontend locally: `firebase emulators:start --only hosting`, or just open `frontend/templates/index.html` in your browser while talking to a local backend at http://localhost:5000 if needed.

Notes & caveats
- Cloud Run instances have ephemeral file systems. Backend file-writing (uploads/reports) will persist only while the instance is alive. For persistent storage, use Cloud Storage and update the app accordingly.
- Make sure to secure any API keys and set environment variables via Cloud Run or Secret Manager.
