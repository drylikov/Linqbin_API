import postgres from 'postgres';

let queryClient = postgres(process.env.DB_PG_URL, {
  keep_alive: 30000, // Use keepAlive instead of keep_alive
});

export function getClient(): postgres.Sql {
  if (!queryClient) {
    throw new Error('Connection: Database is invalid or nonexistent');
  }

  return queryClient;
}
