#!/usr/bin/env bash
set -e
cd /home/manhtien/Gen_paper_based_exam
docker compose up -d postgres-db redis-broker minio-storage minio-init
