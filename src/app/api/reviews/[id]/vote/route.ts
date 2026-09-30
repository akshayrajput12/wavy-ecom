import { z } from "zod";
import { requireUser } from "@/backend/_core/auth";
import { ok, parse, route } from "@/backend/_core/http";
import { voteReview } from "@/backend/reviews/repo";
import { VoteSchema } from "@/backend/reviews/schema";

/** POST /api/reviews/:id/vote { helpful } */
export const POST = route<{ id: string }>("reviews.vote", async ({ req, params }) => {
  const session = await requireUser();
  const { helpful } = await parse(req, VoteSchema);
  await voteReview(session, z.string().uuid().parse(params.id), helpful);
  return ok({ voted: true });
});
