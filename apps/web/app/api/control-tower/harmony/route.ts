import { adjustHarmonyPoints,getHarmonyCustomerDetail,redeemHarmonyReward,reverseHarmonyLedgerEntry } from "@salora/backend";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { currentAuthPayload } from "@/lib/server/auth/http";
import { parseJson,requirePermission,responseError,responseJson } from "@/lib/server/domainHttp";
import type { RoleName } from "@/lib/server/auth/types";
import { enforceRateLimit,rateLimitResponse } from "@/lib/server/rateLimit";
export const dynamic="force-dynamic";export const runtime="nodejs";
const mutation=z.discriminatedUnion("action",[
 z.object({action:z.literal("adjust"),customerId:z.string().uuid(),points:z.number().int().min(-10000).max(10000).refine(v=>v!==0),reason:z.string().trim().min(5).max(180)}),
 z.object({action:z.literal("reverse"),customerId:z.string().uuid(),entryId:z.string().uuid(),reason:z.string().trim().min(5).max(180)}),
 z.object({action:z.literal("redeem"),customerId:z.string().uuid(),rewardId:z.string().uuid(),reason:z.string().trim().min(5).max(180)})
]);
function manager(roles:RoleName[]){return roles.some(r=>r==="MANAGER"||r==="ADMIN");}
export async function GET(request:NextRequest){
 const requestId=request.headers.get("x-request-id")||crypto.randomUUID();
 try{await enforceRateLimit(request,"controlTower");}catch(error){const limited=rateLimitResponse(error,requestId);if(limited)return limited;throw error;}
 if(!(await requirePermission(request,"staff:read"))) return responseError("Forbidden.",requestId,403);
 const customerId=new URL(request.url).searchParams.get("customerId");
 if(!customerId||!z.string().uuid().safeParse(customerId).success)return responseError("Valid customerId is required.",requestId,400);
 const actor=await currentAuthPayload(request);
 return responseJson(await getHarmonyCustomerDetail(customerId,{userId:actor.sub,roles:actor.roles,dbRole:"authenticated"}),requestId);
}
export async function POST(request:NextRequest){
 const requestId=request.headers.get("x-request-id")||crypto.randomUUID();
 try{await enforceRateLimit(request,"controlTower");}catch(error){const limited=rateLimitResponse(error,requestId);if(limited)return limited;throw error;}
 if(!(await requirePermission(request,"user:write")))return responseError("Forbidden.",requestId,403);
 const actor=await currentAuthPayload(request);const roles=actor.roles as RoleName[];
 if(!manager(roles))return responseError("Manager approval is required.",requestId,403);
 const key=request.headers.get("idempotency-key");if(!key||key.length>160)return responseError("A valid Idempotency-Key is required.",requestId,400);
 const parsed=await parseJson(request,mutation);if(!parsed.success)return responseError("Invalid Harmony mutation.",requestId,400);
 try{
  const common={customerId:parsed.data.customerId,reason:parsed.data.reason,idempotencyKey:`harmony:${key}`,actorId:actor.sub,actorRoles:roles,requestId};
  const result=parsed.data.action==="adjust"?await adjustHarmonyPoints({...common,points:parsed.data.points}):parsed.data.action==="reverse"?await reverseHarmonyLedgerEntry({...common,entryId:parsed.data.entryId}):await redeemHarmonyReward({...common,rewardId:parsed.data.rewardId});
  return responseJson(result,requestId,result.applied?201:200);
 }catch(error){return responseError(error instanceof Error?error.message:"Harmony mutation failed.",requestId,409);}
}