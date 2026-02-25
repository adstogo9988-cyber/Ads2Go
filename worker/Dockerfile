FROM python:3.10-slim

WORKDIR /app

# Install system dependencies if required (e.g., for lxml or other libraries)
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy main worker
COPY main.py .

# Run the worker script
CMD ["python", "-u", "main.py"]
