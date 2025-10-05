import { drizzle } from 'drizzle-orm/postgres-js';
import { getClient } from '../connection';
import { entries, type Entry, type NewEntry } from '../models';
import { eq } from 'drizzle-orm';
import { assertEntity } from '../../utils/assertEntity';
import { Logger } from '@control.systems/logger';

const logger = new Logger('EntryRepository');

export async function createEntry({
  title,
  slug,
  content,
  ttl,
  visitCountThreshold,
  hash,
}: NewEntry): Promise<Entry> {
  try {
    const db = drizzle(getClient());
    const entry = await db
      .insert(entries)
      .values({
        title,
        slug,
        content,
        ttl,
        visitCountThreshold,
        remainingVisits: visitCountThreshold,
        hash,
        expiresOn: new Date(Date.now() + 1000 * 60 * 60 * ttl),
        createdOn: new Date(),
      })
      .returning({
        slug: entries.slug,
        title: entries.title,
        content: entries.content,
        ttl: entries.ttl,
        hash: entries.hash,
        visitCountThreshold: entries.visitCountThreshold,
        remainingVisits: entries.remainingVisits,
        createdOn: entries.createdOn,
        expiresOn: entries.expiresOn,
      })
      .execute();

    return entry[0];
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(error);
    }
    throw error;
  }
}

export async function findEntryBySlug(slug: string): Promise<Entry | null> {
  try {
    const db = drizzle(getClient());

    // Check if the entry exists
    const existingEntry = (
      await db.select().from(entries).where(eq(entries.slug, slug)).execute()
    )[0];

    if (
      !assertEntity<Entry>(existingEntry, [
        'slug',
        'title',
        'remainingVisits',
        'ttl',
        'content',
        'createdOn',
        'expiresOn',
      ])
    ) {
      logger.info(`Entry with slug ${slug} not found`);
      return null;
    }

    // Check if visit count threshold is not enabled
    if (existingEntry.visitCountThreshold <= 0) {
      return existingEntry;
    }

    if (existingEntry.remainingVisits <= 0) {
      logger.info(`Entry with slug ${slug} has reached its threshold`);
      await db.delete(entries).where(eq(entries.slug, slug));
      logger.info(`Entry with slug ${slug} has been deleted`);
      return null;
    }

    const updatedEntry = await db
      .update(entries)
      .set({ remainingVisits: existingEntry.remainingVisits - 1 })
      .where(eq(entries.slug, slug))
      .returning({
        slug: entries.slug,
        title: entries.title,
        content: entries.content,
        ttl: entries.ttl,
        hash: entries.hash,
        visitCountThreshold: entries.visitCountThreshold,
        remainingVisits: entries.remainingVisits,
        createdOn: entries.createdOn,
        expiresOn: entries.expiresOn,
      })
      .execute();

    return updatedEntry[0];
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    } else logger.error(error);
    return null;
  }
}

export async function deleteEntry(slug: string) {
  try {
    const db = drizzle(getClient());
    await db.delete(entries).where(eq(entries.slug, slug));
    return true;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    } else logger.error(error);
    return false;
  }
}
