import { z } from "zod";
import { RETURN_REASON } from "@/types/domain";

export const CreateReturnSchema = z.object({
  orderNumber: z.string().trim().min(1).max(40),
  reason: z.enum(RETURN_REASON),
  resolution: z.enum(["refund", "exchange", "store_credit"]).default("refund"),
  customerNote: z.string().trim().max(2000).optional(),
  items: z.array(z.object({
    orderItemId: z.string().uuid(),
    quantity: z.number().int().min(1).max(10),
    reason: z.enum(RETURN_REASON).optional(),
  })).min(1).max(50),
});
export type CreateReturnInput = z.infer<typeof CreateReturnSchema>;
