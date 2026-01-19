// /lib/mca-config.ts

// 1. Pull from environment first
const envUserKey = process.env.NEXT_PUBLIC_MCA_USER_KEY || process.env.MCA_USER_KEY;
const envWorkspace = process.env.NEXT_PUBLIC_MCA_WORKSPACE_ID || process.env.MCA_WORKSPACE_ID;

// 2. Fallbacks for local/dev
export const MCA_USER_KEY = envUserKey ?? 'guest';
export const MCA_WORKSPACE_ID = envWorkspace ?? '645cb008-8bc4-4b37-9968-4dfc343f2b96'; // Tim – Personal

// 3. Optional: runtime banner (for /api/health etc.)
export const MCA_BUILD_INFO = {
  env: process.env.VERCEL_ENV ?? 'local',
  commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
  workspace: MCA_WORKSPACE_ID,
};
