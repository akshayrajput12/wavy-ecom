"use client";

import { AnimatePresence } from "framer-motion";
import { ScanFace } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types/domain";
import { track } from "../analytics";
import { tryOnCopy } from "../data/copy";
import { getTryOnAsset } from "../data/tryonAssets";

// MediaPipe + camera code only downloads when the shopper opens try-on.
const TryOnModal = dynamic(() => import("./TryOnModal").then((m) => m.TryOnModal), { ssr: false });

export function TryOnLauncher({ product, garmentColor }: { product: Product; garmentColor?: string }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  if (!product.tryOnEnabled || !getTryOnAsset(product)) return null;

  return (
    <>
      <Button
        ref={buttonRef} variant="secondary" aria-haspopup="dialog"
        onClick={() => { setOpen(true); track("try_on_opened", { productId: product.id }); }}
      >
        <ScanFace className="size-4" aria-hidden /> {tryOnCopy.launch}
      </Button>
      <AnimatePresence>
        {open && (
          <TryOnModal
            key="tryon" productId={product.id} productName={product.name} asset={getTryOnAsset(product)!} garmentColor={garmentColor}
            onClose={() => { setOpen(false); buttonRef.current?.focus(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
