import { redirect } from "next/navigation";

/** /admin goes straight to the orders. */
export default function AdminIndexPage() {
  redirect("/admin/orders");
}
