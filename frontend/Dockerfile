FROM node:18-alpine

WORKDIR /app

# Copiar los archivos de configuración primero
COPY package*.json ./
COPY .env ./

RUN npm cache clean --force
RUN npm install --legacy-peer-deps
RUN npm install ajv@8.12.0 ajv-keywords@5.1.0 --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["npm", "start"] 