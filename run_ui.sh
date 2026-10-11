#!/bin/bash
# Run this in a second Terminal window.
cd "$(dirname "$0")"
source venv/bin/activate
export API_BASE_URL="${API_BASE_URL:-http://localhost:5001}"
echo "PRISM-PY UI on http://localhost:8501"
streamlit run streamlit_app_enhanced.py --server.port=8501 --server.address=localhost
