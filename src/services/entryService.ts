import { Logger } from '@control.systems/logger';
import type { Entry } from '../data/models';
import {
  createEntry,
  deleteEntry,
  findEntryBySlug,
} from '../data/repositories/entryRepository';
import { Entropy, charset64 } from 'entropy-string';

const logger = new Logger('EntryService');

export async function getEntryBySlug(
  slug: string,
  protoHash: string
): Promise<Omit<Entry, 'hash'> | null> {
  if (!slug || slug.length !== 6) {
    //Save resources on invalid slugs
    logger.info(`Invalid slug ${slug}`);
    return null;
  }

  const entry = await findEntryBySlug(slug);

  if (!entry) {
    logger.info(
      `Entry with slug ${slug} not found or has reached its threshold`
    ).timestamp;

    return null;
  }

  const currentDate = new Date();
  if (currentDate.getTime() > entry.expiresOn.getTime()) {
    logger.info(`Entry with slug ${slug} has expired`);
    await deleteEntry(slug);
    return null;
  }

  const isVerified = await Bun.password.verify(protoHash, entry.hash);

  if (!isVerified) {
    return null;
  }

  const { hash: _, ...strippedHashEntry } = entry; //Remove hash field

  return strippedHashEntry;
}

export async function createNewEntry(
  title: string | undefined,
  content: string,
  ttl: number,
  visitCountThreshold: number,
  protoHash: string
): Promise<Omit<Entry, 'hash'>> {
  try {
    const slug = new Entropy({ charset: charset64, bits: 32 }).string();
    const hash = await Bun.password.hash(protoHash);

    const createdEntry = await createEntry({
      title,
      slug,
      content,
      ttl,
      visitCountThreshold,
      hash,
    });
    const { hash: _, ...entry } = createdEntry; //Remove hash field

    logger.info(`Created new entry with slug ${slug}`);
    return entry;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    } else logger.error(error);
    throw error;
  }
}
