import { loadCustomerIntelligence } from "@salora/backend";
import { type NextRequest } from "next/server";
import { requirePermission, responseError, responseJson } from "@/lib/server/domainHttp";
import { currentAuthPayload } from "@/lib/server/auth/http";

export const dynamic="force-dynamic";
export const runtime="nodejs";

export async function GET(request:NextRequest){
  const requestId=request.headers.get("x-request-id")||crypto.randomUUID();
  if(!(await requirePermission(request,"staff:read"))) return responseError("Forbidden.",requestId,403);
  const actor=await currentAuthPayload(request);
  const customers=await loadCustomerIntelligence({userId:actor.sub,roles:actor.roles});
  const counts=customers.reduce<Record<string,number>>((acc,row)=>{acc[row.lifecycle]=(acc[row.lifecycle]??0)+1;return acc;},{});
  return responseJson({generatedAt:new Date().toISOString(),counts,customers},requestId);
}
