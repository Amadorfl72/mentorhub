FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install flowbite-react --legacy-peer-deps
RUN npm install react-icons --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["npm", "start"] 