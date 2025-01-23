FROM python:3.12-slim

WORKDIR /app

# Instalar netcat para el health check de postgres
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la aplicación
COPY . .

# Hacer ejecutable el script de entrada
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

# Usar el script como punto de entrada
ENTRYPOINT ["./docker-entrypoint.sh"] 