@echo off
REM ============================================================================
REM PRISM-PY - Start FastAPI Main Backend (Port 5001)
REM ============================================================================

cd /d "%~dp0"
echo ============================================================================
echo Starting PRISM-PY Unified FastAPI Backend on Port 5001...
echo All RAG, Precedent Intelligence, and API routes running in single server!
echo ============================================================================

set PORT=5001
set HOST=0.0.0.0

REM Automatically kill any process already holding port 5001
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

python run_api.py
pause
