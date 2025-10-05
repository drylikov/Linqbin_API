
#!/bin/sh
bun src/data/migrate.ts 
echo "Migrations complete"
bun dist/index.js
#this is necessary due to a problem with drizzle, it doesn't exit after the migration
