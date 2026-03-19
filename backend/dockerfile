FROM --platform=linux/amd64 python:3.9-slim

RUN apt-get update && \
    apt-get install -y --fix-broken && \
    apt-get install -y libgomp1 build-essential

# Set working directory
WORKDIR /app

# Copy requirements.txt first to install dependencies
COPY ./app/requirements.txt /app/

ENV PIP_DEFAULT_TIMEOUT=300 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_RETRIES=10

# Install dependencies directly using pip
RUN pip install --no-cache-dir --retries 10 --timeout 300 -r requirements.txt

# Copy the rest of the application code into the container
COPY ./app /app

# Expose the port FastAPI will run on
EXPOSE 8000

# Command to run FastAPI with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--proxy-headers"]
