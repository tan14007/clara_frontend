# Select the image to use
FROM alpine:latest

RUN apk add npm
RUN apk add yarn
# Why canvasjs require such many package
RUN apk add python3
RUN apk add pkgconfig
RUN apk add g++ make
RUN apk add pixman-dev cairo-dev pango-dev jpeg-dev giflib-dev

## Install dependencies in the root of the Container
COPY package.json yarn.lock ./
ENV NODE_PATH=/node_modules
ENV PATH=$PATH:/node_modules/.bin
RUN yarn

# Add project files to /app route in Container
ADD . /app

# Set working dir to /app
WORKDIR /app

# expose port 3000
EXPOSE 3000

ENTRYPOINT [ "/bin/sh", "-c", "yarn start" ]