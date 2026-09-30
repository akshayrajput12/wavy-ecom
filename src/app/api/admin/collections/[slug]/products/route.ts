import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { editMembership } from "@/backend/admin/collections";
import { MembershipSchema } from "@/backend/admin/schemas/catalog";

type P = { slug: string };
const member = (op: "add" | "remove" | "reorder") => route<P>("admin.collections", async ({ req, params }) => {
  const actor = await guard("catalog.write");
  const { productIds } = await parse(req, MembershipSchema);
  return ok(await editMembership(actor, params.slug, op, productIds));
});

/** {productIds} appended in order. */
export const POST = member("add");
/** {productIds} removed. */
export const DELETE = member("remove");
/** {productIds} = the full new order. */
export const PUT = member("reorder");
