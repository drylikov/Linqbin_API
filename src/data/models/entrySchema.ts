import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const entries = pgTable('entries', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 8 }).notNull(),
  title: text('title'),
  content: text('content').notNull(),
  ttl: integer('ttl').notNull(),
  visitCountThreshold: integer('visit_count_threshold').notNull(),
  remainingVisits: integer('remaining_visits').notNull(),
  hash: text('hash').notNull(),
  createdOn: timestamp('created_on').defaultNow().notNull(),
  expiresOn: timestamp('expires_on').notNull(),
});

export type NewEntry = Pick<
  Entry,
  'title' | 'content' | 'ttl' | 'visitCountThreshold' | 'slug' | 'hash'
>;

export type Entry = {
  id?: number;
  slug: string;
  title?: string | null;
  content: string;
  ttl: number;
  visitCountThreshold: number;
  remainingVisits: number;
  hash: string;
  createdOn: Date;
  expiresOn: Date;
};
