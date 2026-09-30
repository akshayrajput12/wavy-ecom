import { z } from "zod";

export const REVIEW_SORTS = ["recent", "high", "low", "helpful"] as const;

export const ReviewListQuery = z.object({
  page: z.coerce.number().int().min(1).max(500).catch(1),
  pageSize: z.coerce.number().int().min(1).max(50).catch(10),
  sort: z.enum(REVIEW_SORTS).catch("recent"),
  rating: z.coerce.number().int().min(1).max(5).optional().catch(undefined),
});
export type ReviewListQuery = z.infer<typeof ReviewListQuery>;

export const SubmitReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(10).max(4000),
  authorName: z.string().trim().min(1).max(80),
  authorLocation: z.string().trim().max(80).optional(),
});
export type SubmitReviewInput = z.infer<typeof SubmitReviewSchema>;

export const VoteSchema = z.object({ helpful: z.boolean() });
