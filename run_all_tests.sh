#!/bin/bash
set -e

echo "================================================================="
echo "   VINH PHÁT PRE-RELEASE LOCAL TEST & VERIFICATION HARNESS       "
echo "   Nền tảng Khảo thí & Luyện thi Toán HSG: dethi.ttgdvinhphat.com"
echo "================================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo ">>> [1/3] Running LaTeX Engine & Math Macro Test Suite..."
python3 tests/test_latex_engine.py

echo ""
echo ">>> [2/3] Running Core API Utils & Composite Indexes Test Suite..."
python3 tests/test_core_api_utils.py

echo ""
echo ">>> [3/3] Running Next.js Frontend Production Build..."
cd frontend
npm run build
cd "$SCRIPT_DIR"

echo ""
echo "================================================================="
echo "   🎉 100% ALL CHECKS PASSED: READY FOR BIG RELEASE BATCH!       "
echo "================================================================="
