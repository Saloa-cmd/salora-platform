import { withPrismaAuthContext, type PrismaAuthContext } from "../../database/rls-context";

export type CustomerLifecycle = "NEW" | "REGULAR" | "VIP" | "AT_RISK" | "DORMANT";

export type CustomerIntelligenceRow = {
  customerId: string;
  displayName: string | null;
  visits: number;
  completedOrders: number;
  lifetimeSpend: number;
  averageOrderValue: number;
  lastVisitAt: Date | null;
  daysSinceLastVisit: number | null;
  loyaltyBalance: number;
  favoriteCategory: string | null;
  lifecycle: CustomerLifecycle;
  lifecycleReason: string;
};

function lifecycle(input: { visits: number; spend: number; days: number | null }): Pick<CustomerIntelligenceRow,"lifecycle"|"lifecycleReason"> {
  if (input.days !== null && input.days >= 60) return { lifecycle:"DORMANT", lifecycleReason:"No observed order for 60+ days." };
  if (input.days !== null && input.days >= 21 && input.visits >= 2) return { lifecycle:"AT_RISK", lifecycleReason:"Previously repeat customer with no observed order for 21+ days." };
  if (input.visits >= 10 || input.spend >= 75) return { lifecycle:"VIP", lifecycleReason:"10+ visits or 75+ OMR observed lifetime spend." };
  if (input.visits >= 2) return { lifecycle:"REGULAR", lifecycleReason:"At least two observed orders." };
  return { lifecycle:"NEW", lifecycleReason:"Fewer than two observed orders." };
}

export async function loadCustomerIntelligence(authContext: PrismaAuthContext): Promise<CustomerIntelligenceRow[]> {
  return withPrismaAuthContext(authContext, async (db) => {
    const rows = await db.$queryRaw<Array<{
      customerId:string; displayName:string|null; visits:number; completedOrders:number;
      lifetimeSpend:number; lastVisitAt:Date|null; loyaltyBalance:number; favoriteCategory:string|null;
    }>>`
      with paid as (
        select p.customer_id, count(*)::int visits,
          coalesce(sum(p.amount),0)::double precision lifetime_spend,
          max(p.paid_at) last_visit_at
        from public.payments p
        where p.customer_id is not null and p.status::text in ('PAID','PARTIALLY_REFUNDED','REFUNDED')
        group by p.customer_id
      ),
      completed as (
        select customer_id, count(*)::int completed_orders
        from public.cafe_orders
        where customer_id is not null and status::text in ('COMPLETED','DELIVERED')
        group by customer_id
      ),
      affinity as (
        select customer_id, category_name
        from (
          select co.customer_id, pc.name as category_name,
            row_number() over(partition by co.customer_id order by sum(oi.quantity) desc, pc.name asc) rn
          from public.cafe_orders co
          join public.order_items oi on oi.order_id=co.id
          join public.catalog_products cp on cp.id=oi.product_id
          join public.product_categories pc on pc.id=cp.category_id
          where co.customer_id is not null
          group by co.customer_id, pc.name
        ) ranked where rn=1
      )
      select cp.id as "customerId", cp.display_name as "displayName",
        coalesce(p.visits,0)::int visits, coalesce(c.completed_orders,0)::int as "completedOrders",
        coalesce(p.lifetime_spend,0)::double precision as "lifetimeSpend",
        p.last_visit_at as "lastVisitAt", coalesce(la.points,0)::int as "loyaltyBalance",
        a.category_name as "favoriteCategory"
      from public.customer_profiles cp
      left join paid p on p.customer_id=cp.id
      left join completed c on c.customer_id=cp.id
      left join public.loyalty_accounts la on la.customer_id=cp.id
      left join affinity a on a.customer_id=cp.id
      order by p.last_visit_at desc nulls last, cp.created_at desc
    `;
    const now=Date.now();
    return rows.map((row)=>{
      const days=row.lastVisitAt ? Math.max(0,Math.floor((now-new Date(row.lastVisitAt).getTime())/86400000)) : null;
      const segment=lifecycle({visits:row.visits,spend:row.lifetimeSpend,days});
      return {...row,averageOrderValue:row.visits>0?row.lifetimeSpend/row.visits:0,daysSinceLastVisit:days,...segment};
    });
  });
}
