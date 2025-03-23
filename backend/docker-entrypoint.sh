#!/bin/sh

# Esperar a que la base de datos esté lista
echo "Waiting for PostgreSQL..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

# Ejecutar migraciones
flask db upgrade

# Iniciar la aplicación
flask run --host=0.0.0.0 