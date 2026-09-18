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
   const customer=await prisma.customerProfile.findUnique({where:{userId:actor.sub},select:{id:true,displayName:true,loyalty:{select:{id:true,tier:true,points:true,ledger:{orderBy:{createdAt:"desc"},take:30,select:{id:true,type:true,points:true,reason:true,createdAt:true}},redemptions:{orderBy:{createdAt:"desc"},take:20,include:{reward:{select:{id:true,name:true,pointsCost:true}}}}}}}});
   if(!customer)return {customer:null,rewards:[],policy:null};
   const member=customer.loyalty?await prisma.$queryRawUnsafe<Array<{membership_code:string}>>("SELECT membership_code FROM loyalty_accounts WHERE id=$1::uuid",customer.loyalty.id):[];
   const policies=await prisma.$queryRawUnsafe<Array<{code:string;points_per_omr:number;welcome_bonus_points:number}>>("SELECT code,points_per_omr,welcome_bonus_points FROM harmony_reward_policies WHERE is_active=true AND effective_from<=now() ORDER BY effective_from DESC LIMIT 1");
   const rewards=await prisma.reward.findMany({where:{isActive:true},orderBy:[{pointsCost:"asc"},{name:"asc"}],select:{id:true,code:true,name:true,pointsCost:true}});
   const loyalty=customer.loyalty?{...customer.loyalty,membershipCode:member[0]?.membership_code??"—"}:null;
   const p=policies[0];const policy=p?{code:p.code,pointsPerOmr:p.points_per_omr,welcomeBonusPoints:p.welcome_bonus_points}:null;
   return {customer:{displayName:customer.displayName,loyalty},rewards,policy};
  });
  if(!data.customer)return responseError("Customer profile not found.",requestId,404);
  return responseJson(data,requestId);
 }catch{return responseError("Unauthorized.",requestId,401);}
}