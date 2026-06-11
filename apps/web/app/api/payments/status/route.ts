import { getRevenuePaymentStatus, paymentStatusRequestSchema, redactPaymentError } from "@salora/backend";
import { type NextRequest } from "next/server";
import { responseError, responseJson } from "@/lib/server/domainHttp";

export function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const parsed = paymentStatusRequestSchema.safeParse({ paymentId: request.nextUrl.searchParams.get("paymentId") });
  if (!parsed.success) return responseError("Invalid payment status request.", requestId, 400);

  try {
    return responseJson(getRevenuePaymentStatus(parsed.data.paymentId), requestId);
  } catch (error) {
    return responseError(redactPaymentError(error), requestId, 404);
  }
}
