# 1. Start with an official Python base image. 'slim' is a good choice for smaller size.
FROM python:3.11-slim

# 2. Set the working directory inside the container.
WORKDIR /app

# 3. Copy the requirements file first to leverage Docker's layer caching.
COPY requirements.txt .

# 4. Install the Python dependencies.
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of your application code and, crucially, the pre-trained models.
# This includes main.py and the 'model_cache' folder.
COPY . .

# 6. Expose the port that the application runs on inside the container.
EXPOSE 8001

# 7. The command to run your application when the container starts.
# --host 0.0.0.0 is essential to make it accessible from outside the container.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]