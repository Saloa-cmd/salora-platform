export function buildOrderContext(order?: { items?: Array<{ name: string; quantity: number }>; total?: number }) {
  return {
    itemCount: order?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0,
    items: order?.items?.map((item) => `${item.quantity}x ${item.name}`) ?? [],
    totalBand: order?.total ? Math.ceil(order.total) : 0
  };
}
