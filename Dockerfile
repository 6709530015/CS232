# 1. Use a standard Python image
FROM python:3.11-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Install 'uv' so we can manage dependencies fast
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# 4. Copy our dependency files first 
COPY pyproject.toml .

# 5. Install the libraries
RUN uv sync --frozen --no-cache

# 6. Copy all our code into the container
COPY . .

# 7. Expose the port FastAPI will run on
EXPOSE 8000

# 8. The command to start our backend!
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
