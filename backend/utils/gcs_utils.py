from google.cloud import storage
import os

BUCKET_NAME = "portfolio-reports-confi360"

storage_client = storage.Client()
bucket = storage_client.bucket(BUCKET_NAME)

def upload_file_to_gcs(local_path, gcs_path, public=True):
    blob = bucket.blob(gcs_path)
    blob.upload_from_filename(local_path)
    # Uniform bucket-level access: cannot set object ACLs
    # Public access must be set at the bucket level or use signed URLs
    return f"https://storage.googleapis.com/{BUCKET_NAME}/{gcs_path}"

def download_file_from_gcs(gcs_path, local_path):
    blob = bucket.blob(gcs_path)
    blob.download_to_filename(local_path)

def get_public_url(gcs_path):
    blob = bucket.blob(gcs_path)
    return blob.public_url
