FROM python:3.11-slim

WORKDIR /app

# Copy dependency file
COPY pyproject.toml .

# Install core dependencies first
RUN pip install --no-cache-dir --timeout=1000 \
    fastapi>=0.109.0 \
    uvicorn[standard]>=0.27.0

# Install database packages (these might be causing the hang)
RUN pip install --no-cache-dir --timeout=1000 \
    sqlalchemy>=2.0.25 \
    PyMySQL>=1.1.0 \
    asyncmy>=0.7.0

# Install remaining dependencies
RUN pip install --no-cache-dir --timeout=1000 \
    pydantic[email]>=2.6.0 \
    pydantic-settings>=2.1.0 \
    python-jose[cryptography]>=3.3.0 \
    passlib[bcrypt]>=1.7.4 \
    python-multipart>=0.0.6

# Copy all code
COPY . .

# Expose port
EXPOSE 8000

# Run the app
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]