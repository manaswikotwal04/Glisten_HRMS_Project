# Stage 1: Build the React application
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 1234

CMD ["npm","run","start","--","--host","0.0.0.0"]
#CMD ["node","src/app.js"]

