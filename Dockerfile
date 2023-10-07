
FROM node:alpine

RUN addgroup --gid 3001 value-system
RUN adduser -D -u 3002 -S value-user -G value-system -s /bin/false -g "npm user"

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install --ignore-scripts
# Bundle app source
COPY . /usr/src/app
RUN npm install

RUN chown -R value-user:value-system /usr/src/app
EXPOSE 9200
CMD [ "npm", "start" ]
