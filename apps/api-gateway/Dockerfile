FROM python:3.11-slim

WORKDIR /app

COPY apps/api-gateway/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY apps/api-gateway .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
