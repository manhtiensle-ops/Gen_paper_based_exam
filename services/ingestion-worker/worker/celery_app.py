import os
from celery import Celery

broker_url = os.getenv("CELERY_BROKER_URL", "redis://redis-broker:6379/0")
result_backend = os.getenv("CELERY_RESULT_BACKEND", "redis://redis-broker:6379/0")

celery_app = Celery(
    "hsg_worker",
    broker=broker_url,
    backend=result_backend,
    include=["worker.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=1800,  # 30 minutes max per exam document
)
