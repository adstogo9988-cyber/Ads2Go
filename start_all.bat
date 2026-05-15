@echo off
echo Starting Next.js Dev Server...
start "Next.js Frontend" cmd /c "npm run dev"

echo Starting Python Worker...
cd worker
start "Python Worker" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8080"

echo Both servers started! Next.js is on port 3000, Worker is on port 8080.
