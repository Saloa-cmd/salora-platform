import { withPrismaAuthContext, type PrismaAuthContext } from "@salora/backend/database/rls-context";

type PulseRow = {
  productsTotal: number;
  productsActive: number;
  productImagesLive: number;
  mediaDrafts: number;
  ordersTotal: number;
  ordersActive: number;
  paymentsTotal: number;
  successfulPayments: number;
  grossRevenue: number;
  refundedAmount: number;
  conversations: number;
  aiEvaluations: number;
  aiRecommendations: number;
  cmsDocuments: number;
  enabledFeatureFlags: number;
  activeRuntimeConfigs: number;
  activityLogs: number;
  auditLogs: number;
};

type ActivityRow = {
  id: string;
  action: string;
  entityType: string;
  createdAt: Date;
};

export type ControlTowerDataPulse = {
  generatedAt: string;
  source: "postgresql-rls";
  commerce: {
    productsTotal: number;
    productsActive: number;
    productImagesLive: number;
    imageCoveragePercent: number;
    mediaDrafts: number;
    ordersTotal: number;
    ordersActive: number;
    paymentsTotal: number;
    successfulPayments: number;
    paymentSuccessPercent: number;
    grossRevenueOmr: number;
    refundedAmountOmr: number;
    netRevenueOmr: number;
  };
  engagement: {
    conversations: number;
  };
  ai: {
    evaluations: number;
    recommendations: number;
    observedRecords: number;
  };
  governance: {
    cmsDocuments: number;
    enabledFeatureFlags: number;
    activeRuntimeConfigs: number;
    activityLogs: number;
    auditLogs: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
  }>;
};

function percentage(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function money(value: number) {
  return Math.round(value * 1000) / 1000;
}

/**
 * Reads a small, permission-scoped operational pulse directly from PostgreSQL.
 * The query is intentionally aggregate-only and never returns customer PII,
 * secrets, payment method references, or arbitrary configuration values.
 */
export async function loadControlTowerDataPulse(authContext: PrismaAuthContext): Promise<ControlTowerDataPulse> {
  return withPrismaAuthContext(authContext, async (db) => {
    // Interactive RLS transactions own one pg.Client. Keep database calls sequential.
    const rows = await db.$queryRaw<PulseRow[]>`
      select
        (select count(*)::int from public.catalog_products where brand_key = 'SALORA') as "productsTotal",
        (select count(*)::int from public.catalog_products where brand_key = 'SALORA' and status::text = 'ACTIVE') as "productsActive",
        (select count(*)::int from public.product_images where archived_at is null and deleted_at is null) as "productImagesLive",
        (select count(*)::int from public.product_media_drafts where archived_at is null) as "mediaDrafts",
        (select count(*)::int from public.cafe_orders) as "ordersTotal",
        (select count(*)::int from public.cafe_orders where status::text in ('PLACED', 'PENDING_CONFIRMATION', 'ACCEPTED', 'PREPARING', 'READY')) as "ordersActive",
        (select count(*)::int from public.payments) as "paymentsTotal",
        (select count(*)::int from public.payments where status::text in ('PAID', 'REFUNDED', 'PARTIALLY_REFUNDED')) as "successfulPayments",
        (select coalesce(sum(amount), 0)::double precision from public.payments where status::text in ('PAID', 'REFUNDED', 'PARTIALLY_REFUNDED')) as "grossRevenue",
        (select coalesce(sum(amount), 0)::double precision from public.refunds where status::text = 'SUCCEEDED') as "refundedAmount",
        (select count(*)::int from public.conversations) as "conversations",
        (select count(*)::int from public.ai_evaluation_records) as "aiEvaluations",
        (select count(*)::int from public.ai_recommendation_records) as "aiRecommendations",
        (select count(*)::int from public.cms_documents where archived_at is null) as "cmsDocuments",
        (select count(*)::int from public.feature_flags where enabled = true and archived_at is null and deleted_at is null) as "enabledFeatureFlags",
        (select count(*)::int from public.runtime_configurations where is_active = true) as "activeRuntimeConfigs",
        (select count(*)::int from public.activity_logs) as "activityLogs",
        (select count(*)::int from public.audit_logs) as "auditLogs"
    `;

    const activity = await db.$queryRaw<ActivityRow[]>`
      select
        id::text as id,
        action,
        entity_type as "entityType",
        created_at as "createdAt"
      from public.activity_logs
      order by created_at desc
      limit 8
    `;

    const row = rows[0] ?? {
      productsTotal: 0,
      productsActive: 0,
      productImagesLive: 0,
      mediaDrafts: 0,
      ordersTotal: 0,
      ordersActive: 0,
      paymentsTotal: 0,
      successfulPayments: 0,
      grossRevenue: 0,
      refundedAmount: 0,
      conversations: 0,
      aiEvaluations: 0,
      aiRecommendations: 0,
      cmsDocuments: 0,
      enabledFeatureFlags: 0,
      activeRuntimeConfigs: 0,
      activityLogs: 0,
      auditLogs: 0
    };

    return {
      generatedAt: new Date().toISOString(),
      source: "postgresql-rls",
      commerce: {
        productsTotal: row.productsTotal,
        productsActive: row.productsActive,
        productImagesLive: row.productImagesLive,
        imageCoveragePercent: percentage(row.productImagesLive, row.productsActive),
        mediaDrafts: row.mediaDrafts,
        ordersTotal: row.ordersTotal,
        ordersActive: row.ordersActive,
        paymentsTotal: row.paymentsTotal,
        successfulPayments: row.successfulPayments,
        paymentSuccessPercent: percentage(row.successfulPayments, row.paymentsTotal),
        grossRevenueOmr: money(row.grossRevenue),
        refundedAmountOmr: money(row.refundedAmount),
        netRevenueOmr: money(row.grossRevenue - row.refundedAmount)
      },
      engagement: {
        conversations: row.conversations
      },
      ai: {
        evaluations: row.aiEvaluations,
        recommendations: row.aiRecommendations,
        observedRecords: row.aiEvaluations + row.aiRecommendations
      },
      governance: {
        cmsDocuments: row.cmsDocuments,
        enabledFeatureFlags: row.enabledFeatureFlags,
        activeRuntimeConfigs: row.activeRuntimeConfigs,
        activityLogs: row.activityLogs,
        auditLogs: row.auditLogs
      },
      recentActivity: activity.map((item) => ({
        id: item.id,
        action: item.action,
        entityType: item.entityType,
        createdAt: item.createdAt.toISOString()
      }))
    };
  });
}
