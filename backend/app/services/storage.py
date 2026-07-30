import os
import boto3
from botocore.exceptions import NoCredentialsError, ClientError

# Read credentials from environment
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "intellcamp-storage")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_ENDPOINT_URL = os.environ.get("R2_ENDPOINT_URL")

s3_client = None

def get_s3_client():
    global s3_client
    if s3_client is None:
        if not R2_ACCESS_KEY_ID or not R2_ENDPOINT_URL:
            print("Warning: R2 credentials are not set in environment variables.")
            return None
        
        s3_client = boto3.client(
            service_name="s3",
            endpoint_url=R2_ENDPOINT_URL,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            region_name="auto" # Cloudflare R2 uses auto region
        )
    return s3_client

def upload_file_to_r2(file_stream, object_name):
    client = get_s3_client()
    if not client:
        raise Exception("S3 client is not configured")
    try:
        client.upload_fileobj(file_stream, R2_BUCKET_NAME, object_name)
    except Exception as e:
        raise Exception(f"Failed to upload to R2: {str(e)}")

def download_file_from_r2(object_name, dest_path):
    client = get_s3_client()
    if not client:
        raise Exception("S3 client is not configured")
    try:
        client.download_file(R2_BUCKET_NAME, object_name, dest_path)
    except Exception as e:
        raise Exception(f"Failed to download from R2: {str(e)}")

def get_r2_file_stream(object_name):
    client = get_s3_client()
    if not client:
        raise Exception("S3 client is not configured")
    try:
        response = client.get_object(Bucket=R2_BUCKET_NAME, Key=object_name)
        return response['Body']
    except Exception as e:
        raise Exception(f"Failed to fetch file stream from R2: {str(e)}")
