import { createOrderDraft, generateWhatsAppMessage, generateWhatsAppUrl, getProductById } from "@salora/data";
import { NextResponse, type NextRequest } from "next/server";
import { orderPreviewSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const payload = await request.json().catch(() => null);
  const parsed = orderPreviewSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid order preview payload",
        requestId,
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
      },
      { status: 400, headers: { "x-request-id": requestId } }
    );
  }

  const items = parsed.data.items.map((item) => {
    const product = getProductById(item.productId);

    if (!product) {
      throw new Error(`Validated product id disappeared from catalog: ${item.productId}`);
    }

    return { product, quantity: item.quantity };
  });
  const order = createOrderDraft(parsed.data.customer, items);

  return NextResponse.json(
    {
      requestId,
      order,
      message: generateWhatsAppMessage(order),
      url: generateWhatsAppUrl(order)
    },
    { headers: { "x-request-id": requestId } }
  );
}
