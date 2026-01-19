// scripts/backfill-memory-classifications.ts
/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';
import { classifyMemoryText } from '@/lib/memory-classifier';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const PAGE_SIZE = 200;

async function main() {
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  console.log('Starting backfill of memory_classifications…');

  let offset = 0;
  let processed = 0;
  let inserted = 0;

  while (true) {
    // Fetch a page of memories that have NO classification rows yet
    const { data: memories, error } = await client
      .rpc('memories_needing_classification', { p_limit: PAGE_SIZE, p_offset: offset });

    if (error) {
      console.error('Error fetching memories_needing_classification:', error);
      break;
    }

    if (!memories || memories.length === 0) {
      console.log('No more memories to classify.');
      break;
    }

    for (const m of memories) {
      processed += 1;
      try {
        const cls = await classifyMemoryText(m.content as string);

        const { error: insErr } = await client.from('memory_classifications').insert([
          {
            memory_id: m.id,
            provider: cls.provider,
            label: cls.label,
            confidence: cls.confidence,
            raw: cls.raw ?? null,
          },
        ]);

        if (insErr) {
          console.error(`Failed to insert classification for memory ${m.id}:`, insErr);
        } else {
          inserted += 1;
        }
      } catch (e: any) {
        console.error(`Classification failed for memory ${m.id}:`, e);
      }
    }

    console.log(`Processed: ${processed}, Inserted classifications: ${inserted}`);

    offset += PAGE_SIZE;
  }

  console.log('Backfill complete.');
}

main().catch((err) => {
  console.error('Fatal error in backfill:', err);
  process.exit(1);
});
