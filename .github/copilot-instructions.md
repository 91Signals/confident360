# Project Status
- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements
- [x] Scaffold the Project
- [x] Customize the Project
- [x] Install Required Extensions
- [x] Compile the Project
- [x] Create and Run Task
- [x] Launch the Project
- [x] Ensure Documentation is Complete

## Project Overview
This project is a Portfolio Analysis App with a Next.js frontend and a Flask backend.
- **Frontend**: Next.js 16 (Static Export) hosted on Firebase Hosting.
- **Backend**: Flask API hosted on Google Cloud Run.
- **Integration**: Firebase Hosting rewrites proxy API requests to Cloud Run.

## Deployment
- **Backend**: Deployed via Cloud Build (`gcloud builds submit`).
- **Frontend**: Deployed via Firebase Hosting (`firebase deploy --only hosting`).
- **Live URL**: https://confi360-7c790.web.app
