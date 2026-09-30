import { ok, route } from "@/backend/_core/http";
import { query } from "@/backend/admin/_shared";
import { listPayments } from "@/backend/admin/payments";
import { PaymentListQuery } from "@/backend/admin/schemas/ops";

/** ?kind=payments|attempts|events&provider&status&failureStage&orderNumber&from&to&page&pageSize */
export const GET = route("admin.payments", async ({ req }) => ok(await listPayments(query(req, PaymentListQuery))));
