FROM node:18-alpine AS build

WORKDIR /opt/node_app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY dev-docs/package.json dev-docs/package.json
COPY src/packages/excalidraw/package.json src/packages/excalidraw/package.json
COPY src/packages/utils/package.json src/packages/utils/package.json
RUN corepack enable pnpm && pnpm install --frozen-lockfile --ignore-optional

ARG NODE_ENV=production

COPY . .
RUN pnpm build:app:docker

FROM nginx:1.21-alpine

COPY --from=build /opt/node_app/build /usr/share/nginx/html

HEALTHCHECK CMD wget -q -O /dev/null http://localhost || exit 1
