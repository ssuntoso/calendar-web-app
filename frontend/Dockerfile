FROM node:18-alpine

ENV REACT_APP_SYNCFUSION_LICENSE=<YOUR_SYNCFUSION_LICENSE>
ENV REACT_APP_API_URL=<API_URL>
ENV REACT_APP_API_VERSION=/api/v1
ENV REACT_APP_API_USER=/user
ENV REACT_APP_API_EVENT=/event
ENV REACT_APP_GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
ENV REACT_APP_GOOGLE_CLIENT_SECRET=<YOUR_GOOGLE_CLIENT_SECRET>
ENV REACT_APP_HASH_SALT=<YOUR_HASH_SALT>

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY tailwind.config.js ./
COPY public/ ./public/
COPY src/ ./src/

EXPOSE 3000

RUN npm install -g serve
RUN npm run build

# Set the command to build and then serve the production build of the React app
CMD ["serve", "-s", "build"]
