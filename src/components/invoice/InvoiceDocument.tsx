import { invoiceCopy as c } from "@/data/copy";
import { formatAmount, formatDateIST } from "@/lib/format";
import type { Invoice, InvoiceLine, InvoiceParty } from "@/types/domain";
import type { InvoiceKit } from "./kit";

type Col = { key: keyof typeof c.cols; w: number; right?: boolean; label?: string; value: (l: InvoiceLine) => number };
const zeroDash = (n: number) => (n ? formatAmount(n) : "—");

function columns(inv: Invoice): Col[] {
  const tax: Col[] = inv.interState
    ? [{ key: "igst", w: 12, right: true, label: `${c.cols.igst} ${c.rate(inv.taxRate)}`, value: (l) => l.igst }]
    : [
        { key: "cgst", w: 9, right: true, label: `${c.cols.cgst} ${c.half(inv.taxRate)}`, value: (l) => l.cgst },
        { key: "sgst", w: 9, right: true, label: `${c.cols.sgst} ${c.half(inv.taxRate)}`, value: (l) => l.sgst },
      ];
  return [
    { key: "price", w: 10, right: true, value: (l) => l.unitPrice },
    { key: "discount", w: 10, right: true, value: (l) => l.discount },
    { key: "taxable", w: 12, right: true, value: (l) => l.taxable },
    ...tax,
    { key: "amount", w: 11, right: true, value: (l) => l.total },
  ];
}

type KitProps = { K: InvoiceKit };
function Party({ K, label, p }: KitProps & { label: string; p: InvoiceParty }) {
  return (
    <K.Box s="party">
      <K.Text s="overline">{label}</K.Text>
      <K.Text s="strong">{p.name}</K.Text>
      {p.lines.map((l) => <K.Text key={l} s="body">{l}</K.Text>)}
      {p.email && <K.Text s="muted">{p.email}</K.Text>}
      {p.phone && <K.Text s="muted">{p.phone}</K.Text>}
    </K.Box>
  );
}
function Meta({ K, label, value }: KitProps & { label: string; value?: string }) {
  return value ? <K.Box s="metaRow"><K.Text s="muted">{label}</K.Text><K.Text s="body" right>{value}</K.Text></K.Box> : null;
}
function Total({ K, label, value }: KitProps & { label: string; value: number }) {
  return <K.Box s="totalRow"><K.Text s="muted">{label}</K.Text><K.Text s="tdNum" right>{formatAmount(value)}</K.Text></K.Box>;
}

/** One invoice, rendered by any kit (screen or PDF). All copy from invoiceCopy; all data from the frozen snapshot. */
export function InvoiceDocument({ invoice: inv, kit: K }: { invoice: Invoice; kit: InvoiceKit }) {
  const money = columns(inv);
  const itemW = inv.interState ? 29 : 23; // columns sum to 100
  const pay = inv.payment;
  const method = pay.method ? c.methods[pay.method] ?? pay.method : undefined;

  return (
    <K.Box s="page">
      <K.Box s="band" />
      <K.Box s="head">
        <K.Box s="brand">
          {inv.seller.logoUrl ? <K.Logo src={inv.seller.logoUrl} alt={inv.seller.storeName} /> : <K.Text s="wordmark">{inv.seller.storeName}</K.Text>}
          <K.Text s="strong">{inv.seller.name}</K.Text>
          {inv.seller.lines.map((l) => <K.Text key={l} s="body">{l}</K.Text>)}
          <K.Text s="muted">{`${c.gstin} ${inv.seller.gstin ?? c.unregistered}`}{inv.seller.stateCode ? ` · ${c.state} ${inv.seller.stateCode} ${inv.seller.state}` : ""}</K.Text>
        </K.Box>
        <K.Box s="titleBlock" right>
          <K.Text s="overline" right>{c.title}</K.Text>
          <K.Text s="title" right>{c.heading}</K.Text>
          <K.Text s="number" right>{inv.number}</K.Text>
        </K.Box>
      </K.Box>

      <K.Box s="parties">
        <Party K={K} label={c.billTo} p={inv.billTo} />
        <Party K={K} label={c.shipTo} p={inv.shipTo} />
        <K.Box s="party">
          <K.Text s="overline">{c.details}</K.Text>
          <Meta K={K} label={c.date} value={formatDateIST(inv.issuedAt)} />
          <Meta K={K} label={c.order} value={inv.orderNumber} />
          <Meta K={K} label={c.orderDate} value={formatDateIST(inv.orderDate)} />
          <Meta K={K} label={c.placeOfSupply} value={[inv.placeOfSupply.code, inv.placeOfSupply.state].filter(Boolean).join(" · ")} />
          <Meta K={K} label={c.payment} value={[c.paymentStatus[pay.status], method].filter(Boolean).join(" · ")} />
          <Meta K={K} label={c.reference} value={pay.reference} />
        </K.Box>
      </K.Box>

      <K.Box s="table">
        <K.Box s="thead">
          <K.Box s="cell" w={4}><K.Text s="th">{c.cols.index}</K.Text></K.Box>
          <K.Box s="cell" w={itemW}><K.Text s="th">{c.cols.item}</K.Text></K.Box>
          <K.Box s="cell" w={7}><K.Text s="th">{c.cols.hsn}</K.Text></K.Box>
          <K.Box s="cell" w={5} right><K.Text s="th" right>{c.cols.qty}</K.Text></K.Box>
          {money.map((m) => <K.Box key={m.key} s="cell" w={m.w} right><K.Text s="th" right>{m.label ?? c.cols[m.key]}</K.Text></K.Box>)}
        </K.Box>
        {inv.lines.map((l, i) => (
          <K.Box key={`${l.kind}-${i}`} s="row">
            <K.Box s="cell" w={4}><K.Text s="tdIndex">{String(i + 1).padStart(2, "0")}</K.Text></K.Box>
            <K.Box s="cell" w={itemW}>
              <K.Text s="td">{l.description}</K.Text>
              {l.detail && <K.Text s="muted">{l.detail}</K.Text>}
            </K.Box>
            <K.Box s="cell" w={7}><K.Text s="tdNum">{l.hsn ?? "—"}</K.Text></K.Box>
            <K.Box s="cell" w={5} right><K.Text s="tdNum" right>{String(l.quantity)}</K.Text></K.Box>
            {money.map((m) => <K.Box key={m.key} s="cell" w={m.w} right><K.Text s="tdNum" right>{zeroDash(m.value(l))}</K.Text></K.Box>)}
          </K.Box>
        ))}
      </K.Box>

      <K.Box s="summary">
        <K.Box s="words">
          <K.Text s="overline">{c.inWords}</K.Text>
          <K.Text s="strong">{inv.amountInWords}</K.Text>
          <K.Text s="muted">{inv.taxInclusive ? c.inclusive : c.exclusive} {c.reverseCharge}</K.Text>
        </K.Box>
        <K.Box s="totals">
          <Total K={K} label={c.taxableValue} value={inv.totals.taxable} />
          {inv.interState
            ? <Total K={K} label={`${c.cols.igst} ${c.rate(inv.taxRate)}`} value={inv.totals.igst} />
            : <><Total K={K} label={`${c.cols.cgst} ${c.half(inv.taxRate)}`} value={inv.totals.cgst} /><Total K={K} label={`${c.cols.sgst} ${c.half(inv.taxRate)}`} value={inv.totals.sgst} /></>}
          {!!inv.totals.roundOff && <Total K={K} label={c.roundOff} value={inv.totals.roundOff} />}
          <K.Box s="grand">
            <K.Text s="grandLabel">{c.totalIn(inv.currency)}</K.Text>
            <K.Text s="grandValue" right>{formatAmount(inv.totals.total)}</K.Text>
          </K.Box>
        </K.Box>
      </K.Box>

      <K.Box s="foot">
        <K.Text s="muted">{c.computer}</K.Text>
        <K.Text s="muted" right>{[inv.seller.storeName, inv.seller.supportEmail, inv.seller.supportPhone].filter(Boolean).join(" · ")}</K.Text>
      </K.Box>
    </K.Box>
  );
}
