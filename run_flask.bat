@echo off
REM ============================================================================
REM PRISM-PY - Start Flask RAG Pipeline (Port 5002)
REM ============================================================================

cd /d "%~dp0"
echo ============================================================================
echo Starting PRISM-PY Flask RAG Pipeline on Port 5002...
echo ============================================================================

set FLASK_PORT=5002
set PORT=5002
set TOKENIZERS_PARALLELISM=false
set OMP_NUM_THREADS=1

REM Automatically kill any process already holding port 5002
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":%PORT%\>" ^| findstr LISTENING') do (
    echo Stopping process PID %%a on port %PORT%...
    taskkill /f /pid %%a >nul 2>&1
)

REM Activate virtual environment if present
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else if exist "..\venv\Scripts\activate.bat" (
    call ..\venv\Scripts\activate.bat
)

python main_complete.py
pause
