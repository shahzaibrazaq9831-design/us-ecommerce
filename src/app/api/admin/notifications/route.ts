import { requireAdminApi } from "@/lib/admin/api-auth";
import { getAdminSnapshot } from "@/lib/admin/data";

/** The bell in the top bar: new orders and low-stock products. */
export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const snapshot = await getAdminSnapshot();
  const lowStock = snapshot.products
    .filter((product) => product.stock <= 5)
    .slice(0, 5)
    .map((product) => ({ id: product.id, name: product.name, stock: product.stock }));

  const newOrders = snapshot.orders
    .filter((order) => order.status === "pending")
    .slice(0, 5)
    .map((order) => ({
      id: order.id,
      customer: order.customer,
      date: order.date,
    }));

  return Response.json({
    lowStock,
    newOrders,
    counts: { lowStock: lowStock.length, newOrders: newOrders.length },
  });
}
