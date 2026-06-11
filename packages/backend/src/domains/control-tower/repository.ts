import { withPrismaAuthContext, type PrismaAuthContext } from "../../database/rls-context";
import { incrementMetric } from "../../runtime/metrics";

export interface ControlTowerRepositoryInterface {
  products: {
    findMany: (filter?: any) => Promise<any[]>;
    findUnique: (where: any) => Promise<any>;
    upsert: (where: any, data: any) => Promise<any>;
    update: (where: any, data: any) => Promise<any>;
  };
  categories: {
    findMany: (filter?: any) => Promise<any[]>;
    findUnique: (where: any) => Promise<any>;
    upsert: (where: any, data: any) => Promise<any>;
    update: (where: any, data: any) => Promise<any>;
  };
  runtimeConfig: {
    findMany: (filter?: any) => Promise<any[]>;
    findUnique: (where: any) => Promise<any>;
    upsert: (where: any, data: any) => Promise<any>;
  };
  activityLogs: {
    findMany: (filter?: any) => Promise<any[]>;
    create: (data: any) => Promise<any>;
  };
  auditLogs: {
    findMany: (filter?: any) => Promise<any[]>;
    create: (data: any) => Promise<any>;
  };
  productImages: {
    findMany: (filter?: any) => Promise<any[]>;
    findUnique: (where: any) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (where: any, data: any) => Promise<any>;
    updateMany: (where: any, data: any) => Promise<any>;
  };
  promotions: {
    findMany: (filter?: any) => Promise<any[]>;
    findUnique: (where: any) => Promise<any>;
    upsert: (where: any, data: any) => Promise<any>;
    update: (where: any, data: any) => Promise<any>;
  };
  coupons: {
    findMany: (filter?: any) => Promise<any[]>;
    findUnique: (where: any) => Promise<any>;
    create: (data: any) => Promise<any>;
    upsert: (where: any, data: any) => Promise<any>;
    update: (where: any, data: any) => Promise<any>;
  };
  orders: {
    findMany: (filter?: any) => Promise<any[]>;
    findUnique: (where: any, options?: any) => Promise<any>;
    update: (where: any, data: any, options?: any) => Promise<any>;
    create: (data: any, options?: any) => Promise<any>;
  };
  featureFlags: {
    findMany: (filter?: any) => Promise<any[]>;
    findUnique: (where: any) => Promise<any>;
    upsert: (where: any, data: any) => Promise<any>;
  };
  aiRecords: {
    create: (data: any) => Promise<any>;
  };
  mediaDrafts: {
    create: (data: any) => Promise<any>;
    findUnique: (where: any, include?: any) => Promise<any>;
    findMany: (filter?: any) => Promise<any[]>;
    update: (where: any, data: any) => Promise<any>;
    updateMany: (where: any, data: any) => Promise<any>;
  };
  whatsapp: {
    commandCenter: () => Promise<{ conversations: any[]; messages: any[]; webhookEvents: any[]; webhookLedgerReady: boolean }>;
  };
}

/**
 * Creates a control tower repository with RLS context automatically applied.
 * All database operations will have RLS context set.
 */
export async function createControlTowerRepository(
  authContext: PrismaAuthContext
): Promise<ControlTowerRepositoryInterface> {
  return {
    products: {
      findMany: (filter?: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_products_find_many");
          return db.catalogProduct.findMany(filter);
        }),

      findUnique: (where: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_products_find_unique");
          return db.catalogProduct.findUnique({ where });
        }),

      upsert: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_products_upsert");
          return db.catalogProduct.upsert({ where, create: data, update: data });
        }),

      update: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_products_update");
          return db.catalogProduct.update({ where, data });
        }),
    },

    categories: {
      findMany: (filter?: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_categories_find_many");
          return db.productCategory.findMany(filter);
        }),

      findUnique: (where: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_categories_find_unique");
          return db.productCategory.findUnique({ where });
        }),

      upsert: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_categories_upsert");
          return db.productCategory.upsert({ where, create: data, update: data });
        }),

      update: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_categories_update");
          return db.productCategory.update({ where, data });
        }),
    },

    runtimeConfig: {
      findMany: (filter?: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_runtime_config_find_many");
          return db.runtimeConfiguration.findMany(filter);
        }),

      findUnique: (where: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_runtime_config_find_unique");
          return db.runtimeConfiguration.findUnique({ where });
        }),

      upsert: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_runtime_config_upsert");
          return db.runtimeConfiguration.upsert({ where, create: data, update: data });
        }),
    },

    activityLogs: {
      findMany: (filter?: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_activity_logs_find_many");
          return db.activityLog.findMany(filter);
        }),

      create: (data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_activity_logs_create");
          return db.activityLog.create({ data });
        }),
    },

    auditLogs: {
      findMany: (filter?: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_audit_logs_find_many");
          return db.auditLog.findMany(filter);
        }),

      create: (data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_audit_logs_create");
          return db.auditLog.create({ data });
        }),
    },

    productImages: {
      findMany: (filter?: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_product_images_find_many");
          return db.productImage.findMany(filter);
        }),

      findUnique: (where: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_product_images_find_unique");
          return db.productImage.findUnique({ where });
        }),

      create: (data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_product_images_create");
          return db.productImage.create({ data });
        }),

      update: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_product_images_update");
          return db.productImage.update({ where, data });
        }),

      updateMany: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_product_images_update_many");
          return db.productImage.updateMany({ where, data });
        }),
    },

    promotions: {
      findMany: (filter?: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_promotions_find_many");
          return db.promotion.findMany(filter);
        }),

      findUnique: (where: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_promotions_find_unique");
          return db.promotion.findUnique({ where });
        }),

      upsert: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_promotions_upsert");
          return db.promotion.upsert({ where, create: data, update: data });
        }),

      update: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_promotions_update");
          return db.promotion.update({ where, data });
        }),
    },

    coupons: {
      findMany: (filter?: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_coupons_find_many");
          return db.coupon.findMany(filter);
        }),

      findUnique: (where: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_coupons_find_unique");
          return db.coupon.findUnique({ where });
        }),

      create: (data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_coupons_create");
          return db.coupon.create({ data });
        }),

      upsert: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_coupons_upsert");
          return db.coupon.upsert({ where, create: data, update: data });
        }),

      update: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_coupons_update");
          return db.coupon.update({ where, data });
        }),
    },

    orders: {
      findMany: (filter?: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_orders_find_many");
          return db.cafeOrder.findMany(filter);
        }),

      findUnique: (where: any, options?: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_orders_find_unique");
          return db.cafeOrder.findUnique({ where, ...(options ?? {}) });
        }),

      update: (where: any, data: any, options?: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_orders_update");
          return db.cafeOrder.update({ where, data, ...(options ?? {}) });
        }),

      create: (data: any, options?: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_orders_create");
          return db.cafeOrder.create({ data, ...(options ?? {}) });
        }),
    },

    featureFlags: {
      findMany: (filter?: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_feature_flags_find_many");
          return db.featureFlag.findMany(filter);
        }),

      findUnique: (where: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_feature_flags_find_unique");
          return db.featureFlag.findUnique({ where });
        }),

      upsert: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_feature_flags_upsert");
          return db.featureFlag.upsert({ where, create: data, update: data });
        }),
    },

    aiRecords: {
      create: (data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_ai_records_create");
          return db.aiRecommendationRecord.create({ data });
        }),
    },

    mediaDrafts: {
      create: (data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_media_drafts_create");
          return db.productMediaDraft.create({ data });
        }),

      findUnique: (where: any, include?: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_media_drafts_find_unique");
          return db.productMediaDraft.findUnique({ where, ...(include ? { include } : {}) });
        }),

      findMany: (filter?: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_media_drafts_find_many");
          return db.productMediaDraft.findMany(filter);
        }),

      update: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_media_drafts_update");
          return db.productMediaDraft.update({ where, data });
        }),

      updateMany: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) => {
          incrementMetric("salora_control_tower_media_drafts_update_many");
          return db.productMediaDraft.updateMany({ where, data });
        }),
    },

    whatsapp: {
      commandCenter: () =>
        withPrismaAuthContext(authContext, async (db) => {
          incrementMetric("salora_control_tower_whatsapp_command_center");
          const [conversations, messages, webhookEvents] = await Promise.all([
            db.conversation.findMany({
              where: { channel: "WHATSAPP" },
              orderBy: { updatedAt: "desc" },
              take: 50,
              include: { messages: { orderBy: { createdAt: "desc" }, take: 5 }, customer: true, order: true }
            }).catch(() => []),
            db.conversationMessage.findMany({
              where: { channel: "WHATSAPP" },
              orderBy: { createdAt: "desc" },
              take: 100
            }).catch(() => []),
            db.whatsappWebhookEvent
              ? db.whatsappWebhookEvent.findMany({ orderBy: { receivedAt: "desc" }, take: 50 }).catch(() => [])
              : Promise.resolve([])
          ]);

          return { conversations, messages, webhookEvents, webhookLedgerReady: Boolean(db.whatsappWebhookEvent) };
        })
    },
  };
}
