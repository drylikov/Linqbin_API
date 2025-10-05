
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      DB_PG_URL: string;
      DB_PG_USER: string;
      DB_PG_PASSWORD: string;
    }
  }
}
