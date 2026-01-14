# ---------- build ----------
FROM node:24 AS build
WORKDIR /tmp/buildApp

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build


# ---------- production ----------
FROM node:24.10.0-alpine3.22 AS production
WORKDIR /usr/src/app

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
ENV SERVER_PORT=8080

# install production deps only
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# compiled app + runtime assets
COPY --from=build /tmp/buildApp/dist ./
COPY ./config ./config

# אם אתה צריך migrations/knex runtime בתוך הקונטיינר:
# (רק אם אתה מריץ migrate מתוך הקונטיינר או שהאפליקציה משתמשת בזה בזמן ריצה)
COPY ./migrations ./migrations
# COPY ./knexfile.js ./knexfile.js   # אם קיים

USER node
EXPOSE 8080

CMD ["dumb-init", "node", "--import", "./instrumentation.mjs", "./index.js"]
