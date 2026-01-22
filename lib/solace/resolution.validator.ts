// ------------------------------------------------------------
// Solace Resolution Validator
// ------------------------------------------------------------
// Runtime Validation (Optional but Safe)
//
// - Validates payload shape at runtime
// - Guards against malformed Solace output
// ------------------------------------------------------------

import { SolaceResolutionSchema } from "./solaceResolution.schema";
import type { SolaceResolution } from "./solaceResolution.schema";
import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, strict: false });

const validate = ajv.compile(SolaceResolutionSchema);

export function validateSolaceResolution(
  payload: unknown
): payload is SolaceResolution {
  const valid = validate(payload);
  if (!valid) {
    console.error(
      "Invalid SolaceResolution payload",
      validate.errors
    );
    return false;
  }
  return true;
}
