@echo off
cd "g:\My websites\Ad2Go\Adsense analyzer\worker"
"g:\My websites\Ad2Go\Adsense analyzer\worker\venv\Scripts\python.exe" -m uvicorn main:app --port 8080 --reload
