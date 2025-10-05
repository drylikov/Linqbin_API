
CREATE TABLE IF NOT EXISTS "entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(8) NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"ttl" integer NOT NULL,
	"visit_count_threshold" integer NOT NULL,
	"remaining_visits" integer NOT NULL,
	"created_on" timestamp DEFAULT now() NOT NULL,
	"expires_on" timestamp NOT NULL
);

