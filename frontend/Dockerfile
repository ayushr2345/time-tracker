# Build stage
FROM node:23-alpine as build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Run stage
FROM node:23-alpine
WORKDIR /app
COPY --from=build /app ./
RUN npm install --omit=dev
EXPOSE 3000
CMD ["npm", "start"]
