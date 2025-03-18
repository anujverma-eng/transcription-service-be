# 1) Use a lightweight Node 18 base image
FROM node:18-alpine

# 2) Create a directory for the app inside the container
WORKDIR /app

# 3) Copy package.json and package-lock.json (if present)
COPY package*.json ./

# 4) Install dependencies
#    (If you have a package-lock.json, you might use `npm ci` for a cleaner install)
RUN npm install

# 5) Copy the rest of your source code
COPY . .

# 6) Build the NestJS app (TypeScript -> dist)
RUN npm run build

# 7) Expose the NestJS port (3000 by default)
EXPOSE 3000

# 8) Start the NestJS application in production mode
CMD ["npm", "run", "start:prod"]


# Development vs. Production Docker
# In dev, you can mount volumes for live reload, or just run locally with npm run start:dev.
# For production, build the Docker image with docker build -t transcription-backend ., then run with docker run -p 3000:3000 transcription-backend.