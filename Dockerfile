
FROM oven/bun

WORKDIR /app

COPY package.json .
COPY bun.lockb .
COPY migrate-and-start.sh .

RUN bun install --production

COPY src src
COPY drizzle drizzle
COPY tsconfig.json .

RUN bun run build

ENV NODE_ENV production
CMD ["bun", "dist/index.js"]

EXPOSE $PORT
