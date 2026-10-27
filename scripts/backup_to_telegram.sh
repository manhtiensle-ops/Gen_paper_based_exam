#!/usr/bin/env bash
# ==============================================================================
# SCRIPT TỰ ĐỘNG BACKUP POSTGRESQL & GỬI LÊN TELEGRAM
# Nền tảng: Giáo Dục Vinh Phát (dethi.ttgdvinhphat.com)
# ==============================================================================
set -e

# Cấu hình Bot Telegram
TELEGRAM_BOT_TOKEN="8832474900:AAGUPsAI0KwApC1cLqCGvG3i9GbdYy0vJS4"
TELEGRAM_CHAT_ID="6560430166"

# Cấu hình đường dẫn
BACKUP_DIR="/second_disk/hsg_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_VN=$(date +"%d/%m/%Y %H:%M:%S")
BACKUP_FILE="${BACKUP_DIR}/hsg_math_backup_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="hsg_postgres_db"
DB_NAME="hsg_math"
DB_USER="postgres"

mkdir -p "$BACKUP_DIR"

echo "=== [1/3] Đang dump cơ sở dữ liệu ${DB_NAME} từ container ${CONTAINER_NAME} ==="
docker exec -i "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip -9 > "$BACKUP_FILE"

# Lấy kích thước file backup
FILE_SIZE_BYTES=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE")
FILE_SIZE_MB=$(awk "BEGIN {printf \"%.2f\", $FILE_SIZE_BYTES/1024/1024}")

echo "=== [2/3] Backup hoàn tất: ${BACKUP_FILE} (${FILE_SIZE_MB} MB) ==="

# Tạo nội dung Caption thông báo
CAPTION="📦 *BÁO CÁO SAO LƯU DỮ LIỆU THÀNH CÔNG*
🏛 *Hệ thống:* Giáo Dục Vinh Phát
📅 *Thời gian:* ${DATE_VN} (Giờ VN)
💾 *Cơ sở dữ liệu:* \`${DB_NAME}\`
📊 *Kích thước:* \`${FILE_SIZE_MB} MB\`
🛡 *Trạng thái:* Toàn vẹn (gzip -9)

_Tệp đính kèm chứa toàn bộ cấu trúc bảng, người dùng, ngân hàng câu hỏi, đề thi và barem điểm._"

echo "=== [3/3] Đang gửi tệp sao lưu lên Telegram ==="
SEND_RES=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument" \
  -F "chat_id=${TELEGRAM_CHAT_ID}" \
  -F "document=@${BACKUP_FILE}" \
  -F "caption=${CAPTION}" \
  -F "parse_mode=Markdown")

OK=$(echo "$SEND_RES" | grep -o '"ok":true' || true)
if [ -n "$OK" ]; then
  echo ">>> [THÀNH CÔNG] Đã chuyển tệp sao lưu tới Telegram!"
else
  echo ">>> [LỖI] Phản hồi từ Telegram: $SEND_RES"
  exit 1
fi

# Dọn dẹp bản sao lưu cũ trên đĩa cứng (chỉ giữ lại 14 ngày gần nhất)
find "$BACKUP_DIR" -type f -name "hsg_math_backup_*.sql.gz" -mtime +14 -delete
echo "=== Đã dọn dẹp các bản backup cũ hơn 14 ngày trên đĩa cứng ==="
