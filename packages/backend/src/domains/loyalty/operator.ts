import { getPrismaClient, withQueryProtection } from "../../database/prisma";
import { applyPersistentLoyaltyMutation } from "./persistence";
import { withPrismaAuthContext, type PrismaAuthContext } from "../../database/rls-context";

export async function getHarmonyCustomerDetail(customerId:string,authContext:PrismaAuthContext){
 return withQueryProtection("harmony.customer.detail",()=>withPrismaAuthContext(authContext,async(prisma)=>{
  const account=await prisma.loyaltyAccount.findUnique({where:{customerId},include:{ledger:{orderBy:{createdAt:"desc"},take:100},redemptions:{include:{reward:true},orderBy:{createdAt:"desc"},take:50}}});
  const rewards=await prisma.reward.findMany({where:{isActive:true},orderBy:[{pointsCost:"asc"},{name:"asc"}]});
  return {account,rewards};
 }));
}

export async function adjustHarmonyPoints(input:{customerId:string;points:number;reason:string;idempotencyKey:string;actorId:string;actorRoles:string[];requestId:string}){
 const result=await applyPersistentLoyaltyMutation({customerId:input.customerId,points:input.points,type:"ADJUST",reason:input.reason,idempotencyKey:input.idempotencyKey,metadata:{source:"control_tower",actorId:input.actorId,actorRoles:input.actorRoles,requestId:input.requestId},audit:{actorId:input.actorId,action:"UPDATE",entityType:"LoyaltyAccount",requestId:input.requestId,reason:input.reason}});
 return result;
}

export async function reverseHarmonyLedgerEntry(input:{customerId:string;entryId:string;reason:string;idempotencyKey:string;actorId:string;actorRoles:string[];requestId:string}){
 const prisma=getPrismaClient();
 const original=await prisma.loyaltyLedgerEntry.findFirst({where:{id:input.entryId,account:{customerId:input.customerId}}});
 if(!original) throw new Error("Loyalty ledger entry not found.");
 if(String(original.type)==="REVERSAL") throw new Error("A reversal entry cannot be reversed directly.");
 const prior=await prisma.$queryRawUnsafe<Array<{id:string}>>("SELECT id FROM loyalty_ledger_entries WHERE type='REVERSAL' AND jsonb_extract_path_text(metadata,'reversesEntryId')=$1 LIMIT 1",original.id);
 if(prior[0]) throw new Error("This loyalty ledger entry has already been reversed.");
 const result=await applyPersistentLoyaltyMutation({customerId:input.customerId,points:original.points,type:"REVERSAL",reason:input.reason,idempotencyKey:input.idempotencyKey,metadata:{source:"control_tower_reversal",reversesEntryId:original.id,actorId:input.actorId,actorRoles:input.actorRoles,requestId:input.requestId},audit:{actorId:input.actorId,action:"UPDATE",entityType:"LoyaltyLedgerEntry",entityId:original.id,requestId:input.requestId,reason:input.reason,before:{points:original.points,type:String(original.type)}}});
 return result;
}


export async function redeemHarmonyReward(input:{customerId:string;rewardId:string;reason:string;idempotencyKey:string;actorId:string;actorRoles:string[];requestId:string}){
 const prisma=getPrismaClient();
 return withQueryProtection("harmony.reward.redeem",async()=>{
  return prisma.$transaction(async(tx)=>{
   const accounts=await tx.$queryRawUnsafe<Array<{id:string;points:number}>>('SELECT id, points FROM loyalty_accounts WHERE customer_id=$1::uuid FOR UPDATE',input.customerId);
   const account=accounts[0];
   if(!account) throw new Error("Loyalty account not found.");
   const reward=await tx.reward.findFirst({where:{id:input.rewardId,isActive:true}});
   if(!reward) throw new Error("Active reward not found.");
   const existing=await tx.$queryRawUnsafe<Array<{id:string;account_id:string}>>('SELECT id, account_id FROM loyalty_ledger_entries WHERE idempotency_key=$1 LIMIT 1',input.idempotencyKey);
   if(existing[0]) return {applied:false,entryId:existing[0].id,accountId:account.id,balance:account.points};
   if(account.points<reward.pointsCost) throw new Error("Insufficient loyalty points.");
   const redemption=await tx.rewardRedemption.create({data:{accountId:account.id,rewardId:reward.id,points:reward.pointsCost}});
   const entries=await tx.$queryRawUnsafe<Array<{id:string}>>(`INSERT INTO loyalty_ledger_entries (id,account_id,type,points,reason,idempotency_key,metadata,created_at) VALUES (gen_random_uuid(),$1::uuid,'REDEEM',$2,$3,$4,$5::jsonb,now()) RETURNING id`,account.id,-reward.pointsCost,input.reason,input.idempotencyKey,JSON.stringify({source:"control_tower_redemption",rewardId:reward.id,redemptionId:redemption.id,actorId:input.actorId,actorRoles:input.actorRoles,requestId:input.requestId}));
   const entry=entries[0]; if(!entry) throw new Error("Unable to create redemption ledger entry.");
   const updated=await tx.loyaltyAccount.update({where:{id:account.id},data:{points:{decrement:reward.pointsCost}}});
   await tx.auditLog.create({data:{actorId:input.actorId,action:"CREATE",entityType:"RewardRedemption",entityId:redemption.id,after:{rewardId:reward.id,points:reward.pointsCost,ledgerEntryId:entry.id,balance:updated.points},requestId:input.requestId,reason:input.reason}});
   return {applied:true,entryId:entry.id,accountId:account.id,redemptionId:redemption.id,balance:updated.points};
  });
 });
}
