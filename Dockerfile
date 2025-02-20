# 1) Use an official Node image
FROM node:18-alpine

# 2) Create a working directory inside the container
WORKDIR /usr/src/app

# 3) Copy package*.json, then install
COPY package*.json ./
RUN npm install

# 4) Copy the rest of the source code
COPY . .

# 5) Build the project (assuming using Nest CLI)
RUN npm run build

# 6) Expose port
EXPOSE 3000

# 7) Start the app
CMD ["npm", "run", "start:prod"]


# Development vs. Production Docker
# In dev, you can mount volumes for live reload, or just run locally with npm run start:dev.
# For production, build the Docker image with docker build -t transcription-backend ., then run with docker run -p 3000:3000 transcription-backend.