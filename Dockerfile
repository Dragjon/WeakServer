# Use a newer Ubuntu base that has GLIBC 2.38+
FROM ubuntu:24.04

# Install Node.js
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

# Create app directory
WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy the rest of your code
COPY . .

# Ensure the binary has permissions
RUN chmod +x ./binaries/weak-1.0.0-linux_v4

# Start the server
CMD ["node", "server.js"]