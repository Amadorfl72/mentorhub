la abrir el proyecto:

#levantar el entorno virtual:

 'source mentorhub-venv/bin/activate' desde la carpeta mentorhub/backend

# Asegurarse de que el servicio de postgres este corriendo

'brew services start postgresql'
#para entrar a la base de datos:

'psql -d mentorhub'

CREATE USER admin WITH PASSWORD 'q1w2e3r4';
CREATE DATABASE mentorhub;
GRANT ALL PRIVILEGES ON DATABASE mentorhub TO admin;
\c mentorhub
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;

\dt                    -- Lista todas las tablas
\d                     -- Lista todas las tablas, vistas y secuencias
\d nombre_tabla        -- Muestra la estructura detallada de una tabla específica
SELECT * FROM users;   -- Ver todos los registros de la tabla users
\x                     -- Activa/desactiva el modo expandido (mejor visualización)
\dt+                   -- Lista las tablas con información adicional
