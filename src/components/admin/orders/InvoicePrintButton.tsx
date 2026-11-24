"use client";

import { Printer } from "lucide-react";

/** The only interactive part of the invoice that is not a normal link. */
export default function InvoicePrintButton() {
  return (
    <button type="button" className="invoice-action invoice-action--primary" onClick={() => window.print()}>
      <Printer size={16} aria-hidden="true" />
      Print / Download PDF
    </button>
  );
}
