FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Limit Node.js heap to avoid OOM on low-RAM servers
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
