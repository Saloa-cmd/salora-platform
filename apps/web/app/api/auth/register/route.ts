import { NextResponse, type NextRequest } from "next/server";
import { applyAuthCookies } from "@/lib/server/auth/cookies";
import { jsonError, registerSchema } from "@/lib/server/auth/http";
import { getAuthService } from "@/lib/server/auth/runtime";
import { enforceRateLimit, rateLimitResponse } from "@/lib/server/rateLimit";

export const dynamic="force-dynamic"; export const runtime="nodejs";
const MAX_BODY_BYTES=8192;
function noStore(response:NextResponse){response.headers.set("cache-control","no-store, max-age=0");return response;}
function sameOrigin(request:NextRequest){
 const origin=request.headers.get("origin"); if(!origin)return true;
 try{return new URL(origin).host===request.nextUrl.host;}catch{return false;}
}
export async function POST(request: NextRequest) {
 const requestId=request.headers.get("x-request-id")||crypto.randomUUID();
 try{
  if(!sameOrigin(request)) return noStore(jsonError("Registration request rejected.",403,requestId));
  const declared=Number(request.headers.get("content-length")||0);
  if(declared>MAX_BODY_BYTES) return noStore(jsonError("Registration payload is too large.",413,requestId));
  await enforceRateLimit(request,"auth");
  const raw=await request.text();
  if(Buffer.byteLength(raw,"utf8")>MAX_BODY_BYTES) return noStore(jsonError("Registration payload is too large.",413,requestId));
  const parsed=registerSchema.safeParse((()=>{try{return JSON.parse(raw)}catch{return null}})());
  if(!parsed.success) return noStore(jsonError("Invalid registration payload.",400,requestId));
  const result=await getAuthService().register(parsed.data);
  return noStore(applyAuthCookies(NextResponse.json({...result,requestId},{status:201,headers:{"x-request-id":requestId}}),result));
 }catch(error){
  const limited=rateLimitResponse(error,requestId);if(limited)return noStore(limited);
  console.error(JSON.stringify({level:"warn",message:"Customer registration failed safely.",route:"/api/auth/register",requestId,errorName:error instanceof Error?error.name:undefined}));
  return noStore(jsonError("Unable to create an account with the supplied details.",409,requestId));
 }
}