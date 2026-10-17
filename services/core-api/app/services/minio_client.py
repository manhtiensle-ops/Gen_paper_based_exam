import os
import io
from minio import Minio

def get_minio_client() -> Minio:
    endpoint = os.getenv("MINIO_ENDPOINT", "minio-storage:9000")
    access_key = os.getenv("MINIO_ROOT_USER", "minioadmin")
    secret_key = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
    use_ssl = os.getenv("MINIO_USE_SSL", "false").lower() == "true"
    
    client = Minio(
        endpoint=endpoint,
        access_key=access_key,
        secret_key=secret_key,
        secure=use_ssl
    )
    bucket_name = os.getenv("MINIO_BUCKET_NAME", "hsg-math-assets")
    if not client.bucket_exists(bucket_name):
        client.make_bucket(bucket_name)
    return client

def upload_file_bytes(data: bytes, object_name: str, content_type: str = "application/octet-stream") -> str:
    client = get_minio_client()
    bucket_name = os.getenv("MINIO_BUCKET_NAME", "hsg-math-assets")
    client.put_object(
        bucket_name,
        object_name,
        io.BytesIO(data),
        length=len(data),
        content_type=content_type
    )
    return object_name
