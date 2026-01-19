//--------------------------------------------------------------
// AUTHORITY CONTEXT — CANONICAL TYPE
//--------------------------------------------------------------

export type AuthorityStatus =
  | "POSITIVE"
  | "NEGATIVE"
  | "INDETERMINATE";

export type AuthorityConfidence =
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export type AuthorityContext = {
  authority: string;     // "USPTO", "FDA", "ISO"
  scope: string;         // "PATENTABILITY", "DEVICE_CLASS"
  status: AuthorityStatus;
  confidence: AuthorityConfidence;
  reason?: string;       // "NO_RESULTS", "QUERY_EXCEPTION"
  data?: any;            // RAW PAYLOAD (read-only)
  timestamp: string;
};
