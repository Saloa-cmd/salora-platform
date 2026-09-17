"use client";
import { useEffect,useMemo,useState } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { controlTowerGet } from "@/lib/control-tower/client";
import { useControlTowerLocale } from "./ControlTowerLocale";

type Row={customerId:string;displayName:string|null;visits:number;lifetimeSpend:number;averageOrderValue:number;daysSinceLastVisit:number|null;loyaltyBalance:number;favoriteCategory:string|null;lifecycle:"NEW"|"REGULAR"|"VIP"|"AT_RISK"|"DORMANT";lifecycleReason:string};
type Payload={generatedAt:string;counts:Record<string,number>;customers:Row[]};

export function HarmonyCustomerWorkspace(){
 const {isArabic}=useControlTowerLocale(); const [data,setData]=useState<Payload|null>(null); const [error,setError]=useState(""); const [segment,setSegment]=useState("ALL");
 useEffect(()=>{void controlTowerGet<Payload>("/api/intelligence/customers/harmony").then(r=>{if(r.status==="success"&&r.data)setData(r.data);else setError(r.message??"Unable to load Harmony intelligence.");});},[]);
 const rows=useMemo(()=>data?.customers.filter(r=>segment==="ALL"||r.lifecycle===segment)??[],[data,segment]);
 const labels:Record<string,string>={ALL:isArabic?"الكل":"All",NEW:isArabic?"جدد":"New",REGULAR:isArabic?"منتظمون":"Regular",VIP:"VIP",AT_RISK:isArabic?"معرضون للفقد":"At risk",DORMANT:isArabic?"خاملون":"Dormant"};
 return <div className="grid gap-5">
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{["NEW","REGULAR","VIP","AT_RISK","DORMANT"].map(k=><DashboardCard key={k} title={labels[k]} eyebrow="Harmony"><p className="text-3xl font-semibold">{data?.counts[k]??0}</p></DashboardCard>)}</div>
  <DashboardCard title={isArabic?"عملاء Harmony":"Harmony Customers"} eyebrow={isArabic?"ذكاء قابل للتفسير":"Explainable intelligence"}>
   <div className="mb-4 flex flex-wrap gap-2">{Object.keys(labels).map(k=><button key={k} onClick={()=>setSegment(k)} className={`min-h-11 rounded-xl border px-3 text-sm ${segment===k?"border-[var(--gold)] bg-[var(--gold)]/10":"border-white/10"}`}>{labels[k]}</button>)}</div>
   {error?<p className="text-sm text-red-200">{error}</p>:null}
   {!data&&!error?<p className="text-sm text-[var(--muted)]">{isArabic?"جارٍ تحميل البيانات...":"Loading governed customer data..."}</p>:null}
   <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-start text-sm"><thead><tr className="border-b border-white/10 text-[var(--muted)]">{[isArabic?"العميل":"Customer",isArabic?"الشريحة":"Segment",isArabic?"الزيارات":"Visits",isArabic?"الإنفاق":"Spend",isArabic?"النقاط":"Points",isArabic?"التفضيل":"Affinity",isArabic?"السبب":"Reason"].map(h=><th key={h} className="px-3 py-3 text-start font-medium">{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.customerId} className="border-b border-white/5"><td className="px-3 py-3">{r.displayName||r.customerId.slice(0,8)}</td><td className="px-3 py-3">{labels[r.lifecycle]}</td><td className="px-3 py-3">{r.visits}</td><td className="px-3 py-3">{r.lifetimeSpend.toFixed(3)} OMR</td><td className="px-3 py-3">{r.loyaltyBalance}</td><td className="px-3 py-3">{r.favoriteCategory??"—"}</td><td className="max-w-xs px-3 py-3 text-[var(--muted)]">{r.lifecycleReason}</td></tr>)}</tbody></table></div>
  </DashboardCard>
 </div>;
}
