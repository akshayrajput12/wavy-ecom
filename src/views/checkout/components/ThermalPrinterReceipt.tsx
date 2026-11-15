"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Printer, Copy, Check, Scissors, RotateCcw, Volume2, VolumeX, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/types/domain";

interface ThermalPrinterReceiptProps {
  order: Order | null;
  number: string;
  invoiceHref?: string;
}

export function ThermalPrinterReceipt({ order, number, invoiceHref }: ThermalPrinterReceiptProps) {
  const [printing, setPrinting] = useState(true);
  const [isTorn, setIsTorn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [printKey, setPrintKey] = useState(0);

  // Play starting 4 seconds audio soundtrack on order success mount as requested
  useEffect(() => {
    if (window.playWavyVibe4s) {
      window.playWavyVibe4s();
    }
  }, []);

  // Simulate paper print out completion
  useEffect(() => {
    setPrinting(true);
    setIsTorn(false);
    const timer = setTimeout(() => {
      setPrinting(false);
      if (soundEnabled) {
        try {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch {
          // ignore
        }
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [printKey, soundEnabled]);

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      toast.success(`Order ID #${number} copied to clipboard!`);
      setTimeout(() => setCopied(null as any), 2000);
    } catch {
      toast.error("Failed to copy Order ID");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadInvoice = () => {
    if (invoiceHref) {
      window.open(invoiceHref, "_blank");
    } else {
      window.print();
    }
  };

  const handleTearOff = () => {
    setIsTorn(true);
    toast.success("Receipt torn off! 🧾");
  };

  const handleReplay = () => {
    setPrintKey((prev) => prev + 1);
  };

  const items = order?.items ?? [
    { id: "1", name: "Oversized Utility Hoodie", variantTitle: "Black / L", quantity: 1, unitPrice: 249900, lineTotal: 249900 },
    { id: "2", name: "Wavy Cap", variantTitle: "Default", quantity: 1, unitPrice: 89900, lineTotal: 89900 },
  ];

  const subtotal = order?.totals?.subtotal ?? 339800;
  const tax = order?.totals?.tax ?? 61164;
  const discount = order?.totals?.discount ?? 33980;
  const shipping = order?.totals?.shipping ?? 0;
  const total = order?.totals?.total ?? 366984;
  const paymentMethod = order?.paymentProvider ? order.paymentProvider.toUpperCase() : "PAID VIA RAZORPAY";
  const orderDate = order?.placedAt ? new Date(order.placedAt).toLocaleString() : new Date().toLocaleString();

  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* Print-only CSS to format thermal receipt cleanly for browser printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt-printable, #thermal-receipt-printable * {
            visibility: visible !important;
          }
          #thermal-receipt-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Printer Slot Base Machine Box */}
      <div className="relative rounded-3xl border border-white/10 bg-[#16171a] p-6 shadow-2xl sm:p-8 backdrop-blur-md">
        {/* Machine Header Strip */}
        <div className="flex items-center justify-between pb-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span
              className={`size-2.5 rounded-full ${
                printing ? "bg-amber-400 animate-ping" : "bg-emerald-400 shadow-[0_0_8px_#34d399]"
              }`}
            />
            <span className="font-bold tracking-widest text-zinc-200 uppercase">
              {printing ? "PRINTING RECEIPT..." : "POS PRINTER READY"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="rounded-full p-1 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title={soundEnabled ? "Mute printer sounds" : "Enable printer sounds"}
            >
              {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
            <button
              type="button"
              onClick={handleReplay}
              className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-micro hover:bg-white/10 text-zinc-300 transition-colors"
            >
              <RotateCcw className="size-3" />
              <span>Reprint</span>
            </button>
          </div>
        </div>

        {/* Printer Slot Mouth Opening */}
        <div className="relative z-20 mx-auto flex h-3.5 w-full max-w-[90%] items-center justify-center rounded-b-md border-x border-b border-white/20 bg-gradient-to-b from-black via-zinc-900 to-zinc-800 shadow-inner">
          <div className="h-0.5 w-3/4 rounded-full bg-zinc-950" />
        </div>

        {/* Paper Container sliding out of the printer slot */}
        <div className="relative z-10 overflow-hidden pt-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={printKey}
              initial={{ y: "-92%", opacity: 0.2 }}
              animate={{ y: isTorn ? 16 : 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 90,
                damping: 15,
                mass: 1,
              }}
              className="w-full"
            >
              {/* Thermal Paper Document */}
              <div
                id="thermal-receipt-printable"
                className="relative bg-[#faf9f5] text-[#111111] font-mono p-6 sm:p-8 shadow-2xl transition-transform duration-500"
                style={{
                  clipPath: isTorn
                    ? "polygon(0% 0%, 100% 0%, 100% 97%, 95% 100%, 90% 97%, 85% 100%, 80% 97%, 75% 100%, 70% 97%, 65% 100%, 60% 97%, 55% 100%, 50% 97%, 45% 100%, 40% 97%, 35% 100%, 30% 97%, 25% 100%, 20% 97%, 15% 100%, 10% 97%, 5% 100%, 0% 97%)"
                    : "polygon(0% 0%, 100% 0%, 100% 98%, 97% 100%, 94% 98%, 91% 100%, 88% 98%, 85% 100%, 82% 98%, 79% 100%, 76% 98%, 73% 100%, 70% 98%, 67% 100%, 64% 98%, 61% 100%, 58% 98%, 55% 100%, 52% 98%, 49% 100%, 46% 98%, 43% 100%, 40% 98%, 37% 100%, 34% 98%, 31% 100%, 28% 98%, 25% 100%, 22% 98%, 19% 100%, 16% 98%, 13% 100%, 10% 98%, 7% 100%, 4% 98%, 0% 100%)",
                }}
              >
                {/* Perforated Top Tear Indicator Line */}
                <div
                  onClick={handleTearOff}
                  className="group relative cursor-pointer border-b border-dashed border-zinc-400 pb-3 text-center transition-colors hover:border-black"
                  title="Click to tear off paper"
                >
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-black flex items-center justify-center gap-1">
                    <Scissors className="size-3" />
                    <span>PERFORATED TEAR LINE</span>
                  </span>
                </div>

                {/* Receipt Header & Logo */}
                <div className="text-center pt-4 pb-4 border-b border-dashed border-zinc-400">
                  <h2 className="text-2xl font-black tracking-widest text-black">W A V Y</h2>
                  <p className="text-[11px] font-bold tracking-wider text-zinc-600 uppercase">
                    Streetwear & Luxury · Est. 2026
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase mt-0.5">
                    Official POS Thermal Receipt
                  </p>
                </div>

                {/* Receipt Metadata */}
                <div className="py-3 text-xs space-y-1 border-b border-dashed border-zinc-400">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">ORDER NO:</span>
                    <span className="font-bold text-black">#{number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">DATE/TIME:</span>
                    <span className="text-zinc-800">{orderDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">PAYMENT:</span>
                    <span className="font-bold text-black">{paymentMethod}</span>
                  </div>
                  {order?.customerName && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">CUSTOMER:</span>
                      <span className="text-zinc-800">{order.customerName}</span>
                    </div>
                  )}
                </div>

                {/* Itemized Products List */}
                <div className="py-4 space-y-3 border-b border-dashed border-zinc-400">
                  <div className="flex justify-between text-[11px] font-bold text-zinc-500 uppercase border-b border-zinc-200 pb-1">
                    <span>ITEM DESCR.</span>
                    <span>AMOUNT</span>
                  </div>

                  {items.map((item: any, i: number) => (
                    <div key={i} className="text-xs space-y-0.5">
                      <div className="flex justify-between font-bold text-black">
                        <span className="line-clamp-1 pr-2">{item.name || item.title}</span>
                        <span className="shrink-0">{formatPrice(item.lineTotal || item.unitPrice * (item.quantity || 1))}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-500">
                        <span>
                          {item.variantTitle !== "Default" ? item.variantTitle : "Standard"} × {item.quantity || 1}
                        </span>
                        <span>@{formatPrice(item.unitPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Totals Breakdown */}
                <div className="py-3 text-xs space-y-1.5 border-b border-dashed border-zinc-400">
                  <div className="flex justify-between text-zinc-600">
                    <span>SUBTOTAL</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>COUPON DISCOUNT</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-zinc-600">
                    <span>TAX (GST INCL)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>

                  <div className="flex justify-between text-zinc-600">
                    <span>SHIPPING FEE</span>
                    <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
                  </div>

                  <div className="flex justify-between text-base font-black text-black border-t border-zinc-800 pt-2 mt-1">
                    <span>TOTAL DUE</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Stamp & Payment Badge */}
                <div className="my-4 flex items-center justify-center">
                  <div className="rotate-[-6deg] rounded-md border-2 border-emerald-700 px-4 py-1 text-center font-black text-emerald-700 tracking-widest text-xs uppercase">
                    ✓ PAID IN FULL · VERIFIED
                  </div>
                </div>

                {/* Barcode / QR Code Representation */}
                <div className="flex flex-col items-center justify-center pt-2 pb-2">
                  {/* SVG Barcode */}
                  <svg className="h-10 w-full max-w-[220px]" viewBox="0 0 200 40">
                    <rect width="200" height="40" fill="#faf9f5" />
                    {[
                      2, 5, 9, 12, 18, 22, 27, 33, 37, 42, 48, 52, 58, 62, 68, 74, 78, 85, 90, 95, 102, 108,
                      114, 120, 125, 132, 138, 145, 150, 158, 164, 172, 178, 185, 192,
                    ].map((x, i) => (
                      <rect key={i} x={x} y="4" width={i % 3 === 0 ? 3 : 1.5} height="32" fill="#111111" />
                    ))}
                  </svg>
                  <span className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase mt-1">
                    *{number}*
                  </span>
                </div>

                {/* Footer Thank You Message */}
                <div className="text-center pt-2 pb-4 text-[11px] text-zinc-600 border-t border-dashed border-zinc-400">
                  <p className="font-bold uppercase tracking-wider text-black">
                    Thank you for shopping with WAVY!
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Keep it Wavy · Support: help@wavy.store
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Controls Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={handleDownloadInvoice}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-black transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Download className="size-4" />
            <span>Download Invoice PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Printer className="size-4" />
            <span>Print Receipt</span>
          </button>

          <button
            type="button"
            onClick={handleCopyOrderId}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
            <span>Copy Order ID</span>
          </button>

          <button
            type="button"
            onClick={handleTearOff}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Scissors className="size-4" />
            <span>{isTorn ? "Paper Torn" : "Tear Off Paper"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
