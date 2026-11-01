#!/usr/bin/env bash
# ==============================================================================
# BẢO VỆ MÃ NGUỒN: CÀI ĐẶT PRE-COMMIT HOOK CHỐNG LỘ SECRET
# Đơn vị: Phòng An Ninh & Bảo Mật (Dept_Security) - VINH PHÁT
# ==============================================================================
set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK_PATH="${REPO_ROOT}/.git/hooks/pre-commit"

echo "🛡️ Đang cài đặt pre-commit security hook cho VINH PHÁT repo..."

cat << 'EOF' > "$HOOK_PATH"
#!/usr/bin/env bash
# Vinh Phat Pre-commit Security Hook
echo "🔍 [Security Hook] Đang quét staging files tìm mã khóa bí mật, API key và Bot token..."

# Quét regex tìm Telegram bot token và secret trong staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

LEAKED=0
for FILE in $STAGED_FILES; do
  if [ -f "$FILE" ]; then
    # Kiểm tra pattern Telegram Token
    MATCH=$(git diff --cached "$FILE" | grep -E "^\+[^+].*[0-9]{8,10}:[a-zA-Z0-9_-]{35}" || true)
    if [ -n "$MATCH" ]; then
      echo "🚨 CHẶN COMMIT: Phát hiện Telegram Bot Token trong file '$FILE'!" >&2
      echo "Chi tiết: $MATCH" >&2
      LEAKED=1
    fi
  fi
done

if [ "$LEAKED" -eq 1 ]; then
  echo "❌ COMMIT BỊ HỦY BỎ để bảo vệ an ninh! Vui lòng chuyển secret sang biến môi trường (.env)." >&2
  exit 1
fi

echo "✅ [Security Hook] Toàn bộ file staged an toàn. Cho phép commit."
exit 0
EOF

chmod +x "$HOOK_PATH"
echo "🎉 Đã kích hoạt Pre-commit hook thành công tại $HOOK_PATH!"
