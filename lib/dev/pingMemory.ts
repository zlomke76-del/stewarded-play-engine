'use client';

// Temporary stub to keep builds passing. This avoids relying on any
// Supabase client exports that may change while we stabilize memory.

export async function pingMemory(note = 'hello from UI') {
  if (typeof window !== 'undefined') {
    console.log('[pingMemory stub]', note);
  }
}
