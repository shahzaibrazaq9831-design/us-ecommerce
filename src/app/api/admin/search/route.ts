import { requireAdminApi } from "@/lib/admin/api-auth";
import { getAdminSnapshot } from "@/lib/admin/data";

/** Ctrl+K search. The session is checked before any data is read. */
export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (query.length < 2) return Response.json({ results: [] });

  const snapshot = await getAdminSnapshot();
  const results: { title: string; subtitle: string; href: string; type: string }[] = [];

  for (const order of snapshot.orders) {
    if (
      [order.id, order.customer, order.email, order.city].some((value) =>
        value.toLowerCase().includes(query)
      )
    ) {
      results.push({
        title: order.id,
        subtitle: `${order.customer} · ${order.status.replace(/_/g, " ")}`,
        href: `/admin/orders?order=${encodeURIComponent(order.id)}`,
        type: "Order",
      });
    }
  }

  for (const product of snapshot.products) {
    if (
      [product.name, product.slug, product.brandName, product.sku].some((value) =>
        value.toLowerCase().includes(query)
      )
    ) {
      results.push({
        title: product.name,
        subtitle: `${product.brandName} · ${product.stock} in stock`,
        href: `/admin/products?product=${product.id}`,
        type: "Product",
      });
    }
  }

  for (const customer of snapshot.customers) {
    if ([customer.name, customer.email, customer.city].some((value) =>
      value.toLowerCase().includes(query)
    )) {
      results.push({
        title: customer.name,
        subtitle: `${customer.email} · ${customer.orders} orders`,
        href: `/admin/customers?email=${encodeURIComponent(customer.email)}`,
        type: "Customer",
      });
    }
  }

  return Response.json({ results: results.slice(0, 12) });
}
