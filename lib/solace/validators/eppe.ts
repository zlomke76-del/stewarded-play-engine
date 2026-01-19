// lib/solace/validators/eppe.ts

import Ajv, { ErrorObject } from "ajv";
import addFormats from "ajv-formats";

import eppe01Schema from "../schemas/eppe-01.schema.json";

const ajv = new Ajv({
  allErrors: true,
  strict: false,
});

addFormats(ajv);

const validate = ajv.compile(eppe01Schema);

export function validateEPPE01(
  data: unknown
): { valid: boolean; errors?: ErrorObject[] } {
  const valid = validate(data);

  return {
    valid: Boolean(valid),
    errors: validate.errors ?? undefined,
  };
}
