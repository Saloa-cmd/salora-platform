import { getPrismaClient, withQueryProtection } from "../../database/prisma";
import { applyPersistentLoyaltyMutation } from "./persistence";

export async function getHarmonyCustomerDetail(customerId:string){
 const prisma=getPrismaClient();
 return withQueryProtection("harmony.customer.detail",async()=>{
  const account=await prisma.loyaltyAccount.findUnique({where:{customerId},include:{ledger:{orderBy:{createdAt:"desc"},take:100},redemptions:{include:{reward:true},orderBy:{createdAt:"desc"},take:50}}});
  const rewards=await prisma.reward.findMany({where:{isActive:true},orderBy:[{pointsCost:"asc"},{name:"asc"}]});
  return {account,rewards};
 });
}

export async function adjustHarmonyPoints(input:{customerId:string;points:number;reason:string;idempotencyKey:string;actorId:string;actorRoles:string[];requestId:string}){
 const result=await applyPersistentLoyaltyMutation({customerId:input.customerId,points:input.points,type:"ADJUST",reason:input.reason,idempotencyKey:input.idempotencyKey,metadata:{source:"control_tower",actorId:input.actorId,actorRoles:input.actorRoles,requestId:input.requestId}});
 const prisma=getPrismaClient();
 if(result.applied) await prisma.auditLog.create({data:{actorId:input.actorId,action:"UPDATE",entityType:"LoyaltyAccount",entityId:result.accountId,after:{entryId:result.entryId,balance:result.balance,points:input.points},requestId:input.requestId,reason:input.reason}});
 return result;
}

export async function reverseHarmonyLedgerEntry(input:{customerId:string;entryId:string;reason:string;idempotencyKey:string;actorId:string;actorRoles:string[];requestId:string}){
 const prisma=getPrismaClient();
 const original=await prisma.loyaltyLedgerEntry.findFirst({where:{id:input.entryId,account:{customerId:input.customerId}}});
 if(!original) throw new Error("Loyalty ledger entry not found.");
 if(String(original.type)==="REVERSAL") throw new Error("A reversal entry cannot be reversed directly.");
 const result=await applyPersistentLoyaltyMutation({customerId:input.customerId,points:Math.abs(original.points),type:"REVERSAL",reason:input.reason,idempotencyKey:input.idempotencyKey,metadata:{source:"control_tower_reversal",reversesEntryId:original.id,actorId:input.actorId,actorRoles:input.actorRoles,requestId:input.requestId}});
 if(result.applied) await prisma.auditLog.create({data:{actorId:input.actorId,action:"UPDATE",entityType:"LoyaltyLedgerEntry",entityId:original.id,before:{points:original.points,type:original.type},after:{reversalEntryId:result.entryId,balance:result.balance},requestId:input.requestId,reason:input.reason}});
 return result;
}
