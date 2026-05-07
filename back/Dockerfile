# 1. Use a standard Python image
FROM python:3.11-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3.1 Set PATH for uv before installing
ENV PATH="/root/.local/bin:$PATH"

# 3.2 Install curl (needed for uv installer)
RUN DEBIAN_FRONTEND=noninteractive apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# 3.3 Install curl and uv
RUN curl -Ls https://astral.sh/uv/install.sh | sh

# 4. Copy our dependency files first 
COPY pyproject.toml .

# 5. Install the libraries
RUN uv sync --no-cache

# 6. Copy all our code into the container
COPY . .

# 7. Expose the port FastAPI will run on
EXPOSE 8000

# 8. The command to start our backend!
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]