import { type NextRequest } from "next/server";
import { withPrismaAuthContext } from "@salora/backend";
import { currentAuthPayload } from "@/lib/server/auth/http";
import { responseError, responseJson } from "@/lib/server/domainHttp";

export const dynamic="force-dynamic"; export const runtime="nodejs";

export async function GET(request:NextRequest){
 const requestId=request.headers.get("x-request-id")||crypto.randomUUID();
 try{
  const actor=await currentAuthPayload(request);
  const data=await withPrismaAuthContext({userId:actor.sub,roles:actor.roles,dbRole:"authenticated"},async prisma=>{
   const customer=await prisma.customerProfile.findUnique({where:{userId:actor.sub},select:{id:true,displayName:true,loyalty:{select:{id:true,points:true,ledger:{orderBy:{createdAt:"desc"},take:30,select:{id:true,type:true,points:true,reason:true,createdAt:true}},redemptions:{orderBy:{createdAt:"desc"},take:20,include:{reward:{select:{id:true,name:true,pointsCost:true}}}}}}}});
   const rewards=await prisma.reward.findMany({where:{isActive:true},orderBy:[{pointsCost:"asc"},{name:"asc"}],select:{id:true,code:true,name:true,pointsCost:true}});
   return {customer,rewards};
  });
  if(!data.customer) return responseError("Customer profile not found.",requestId,404);
  return responseJson(data,requestId);
 }catch{return responseError("Unauthorized.",requestId,401);}
}