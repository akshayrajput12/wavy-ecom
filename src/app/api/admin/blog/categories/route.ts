import { ok, route } from "@/backend/_core/http";
import { listBlogCategories } from "@/backend/admin/blog";

export const GET = route("admin.blog", async () => ok(await listBlogCategories()));
