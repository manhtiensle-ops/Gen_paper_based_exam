#!/usr/bin/env bash
set -e
cd /home/manhtien/Gen_paper_based_exam
docker compose down || true
docker volume rm -f gen_paper_based_exam_pgdata gen_paper_based_exam_miniodata gen_paper_based_exam_redisdata 2>/dev/null || true
docker compose up -d postgres-db redis-broker minio-storage
