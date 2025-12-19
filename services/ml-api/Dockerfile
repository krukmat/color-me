FROM python:3.10-slim

WORKDIR /app

COPY pyproject.toml ./

RUN pip install --no-cache-dir fastapi==0.116.2 uvicorn==0.23.0 pydantic==2.9.0 httpx==0.26.2

COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
