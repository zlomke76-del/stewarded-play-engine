import { z } from "zod";

export const rubricSchema = z.object({
  bias: z.string().optional(),
  clarity: z.string().optional(),
  neutrality: z.string().optional(),
  emotional_charge: z.string().optional(),
  structure: z.string().optional(),
  accuracy_risk: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
});
