import { ApiError, ok, route } from "@/backend/_core/http";
import { getTryOnAsset } from "@/tryon/data/tryonAssets";

/** Public product calibration metadata for first-party storefront clients. */
export const GET = route<{ productId: string }>("tryon.v1", async ({ params }) => {
  const asset = getTryOnAsset({ id: params.productId, slug: params.productId });
  if (!asset) throw new ApiError(404, "tryon_asset_not_found", "No try-on asset is configured for this product");
  return ok({ apiVersion: "v1", productId: params.productId, ...asset });
});
