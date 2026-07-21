import { revalidatePath } from "next/cache";
import { type NextRequest } from "next/server";
import { createControlTowerRepository } from "@salora/backend/domains/control-tower/repository";
import { z } from "zod";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { handleError, parseBody, requireControlPermission, requestId, slugify } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BRAND_KEY = "SALORA";
const resourceType = z.enum(["PAGE", "SECTION", "NAVIGATION", "BANNER", "CAMPAIGN", "LANDING_PAGE"]);
const payload = z.record(z.string(), z.unknown()).superRefine((value, context) => {
  if (JSON.stringify(value).length > 250_000) context.addIssue({ code: "custom", message: "Payload exceeds 250 KB." });
});

const mutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), resourceType, key: z.string().min(2).max(140), slug: z.string().max(180).optional(), titleAr: z.string().min(2).max(200), titleEn: z.string().min(2).max(200), payload, changeSummary: z.string().max(500).optional() }),
  z.object({ action: z.literal("save"), documentId: z.string().uuid(), titleAr: z.string().min(2).max(200).optional(), titleEn: z.string().min(2).max(200).optional(), slug: z.string().max(180).nullable().optional(), payload, changeSummary: z.string().max(500).optional() }),
  z.object({ action: z.literal("submit"), documentId: z.string().uuid(), note: z.string().max(1000).optional() }),
  z.object({ action: z.enum(["approve", "reject"]), documentId: z.string().uuid(), approvalId: z.string().uuid(), note: z.string().min(3).max(1000) }),
  z.object({ action: z.literal("publish"), documentId: z.string().uuid() }),
  z.object({ action: z.literal("schedule"), documentId: z.string().uuid(), scheduledAt: z.string().datetime() }),
  z.object({ action: z.literal("rollback"), documentId: z.string().uuid(), revisionId: z.string().uuid(), reason: z.string().min(3).max(500) }),
  z.object({ action: z.literal("archive"), documentId: z.string().uuid(), reason: z.string().min(3).max(500) })
]);

function permissionFor(action: z.infer<typeof mutationSchema>["action"]) {
  if (action === "approve" || action === "reject") return "content:approve";
  if (action === "publish" || action === "schedule" || action === "rollback" || action === "archive") return "content:publish";
  if (action === "submit") return "content:request-approval";
  return "content:write";
}

function auditData(actorId: string, action: string, entityId: string, before: unknown, after: unknown, id: string, reason?: string) {
  return { actorId, action, entityType: "CmsDocument", entityId, before, after, requestId: id, reason };
}

export async function GET(request: NextRequest) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "content:read");
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });
    const documentId = request.nextUrl.searchParams.get("documentId");
    const result = await repo.cms.run(async (db) => {
      if (documentId) {
        const document = await db.cmsDocument.findFirst({ where: { id: documentId, brandKey: BRAND_KEY }, include: { revisions: { orderBy: { version: "desc" }, take: 50 }, approvals: { orderBy: { requestedAt: "desc" }, take: 50 } } });
        if (!document) return null;
        const audit = await db.auditLog.findMany({ where: { entityType: "CmsDocument", entityId: documentId }, orderBy: { createdAt: "desc" }, take: 100 });
        return { document, audit };
      }
      return db.cmsDocument.findMany({ where: { brandKey: BRAND_KEY }, orderBy: [{ updatedAt: "desc" }], include: { revisions: { orderBy: { version: "desc" }, take: 1 }, approvals: { where: { status: "PENDING" }, take: 1 } }, take: 250 });
    });
    if (documentId && !result) return responseError("Content document not found.", id, 404);
    return responseJson(result, id);
  } catch (error) {
    return handleError(error, id);
  }
}

export async function POST(request: NextRequest) {
  return mutate(request);
}

export async function PATCH(request: NextRequest) {
  return mutate(request);
}

async function mutate(request: NextRequest) {
  const id = requestId(request);
  try {
    const parsed = await parseBody(request, mutationSchema);
    if (!parsed.success) return responseError("Invalid content workflow payload.", id, 422);
    const input = parsed.data;
    const actor = await requireControlPermission(request, permissionFor(input.action));
    const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles });

    const result = await repo.cms.run(async (db) => {
      if (input.action === "create") {
        const document = await db.cmsDocument.create({ data: { brandKey: BRAND_KEY, resourceType: input.resourceType, key: slugify(input.key), slug: input.slug ? slugify(input.slug) : null, titleAr: input.titleAr, titleEn: input.titleEn, createdBy: actor.sub, updatedBy: actor.sub } });
        const revision = await db.cmsRevision.create({ data: { documentId: document.id, version: 1, payload: input.payload, changeSummary: input.changeSummary, createdBy: actor.sub } });
        const after = await db.cmsDocument.update({ where: { id: document.id }, data: { activeRevisionId: revision.id }, include: { revisions: true, approvals: true } });
        await db.auditLog.create({ data: auditData(actor.sub, "CREATE", document.id, null, after, id, input.changeSummary) });
        return after;
      }

      const before = await db.cmsDocument.findFirst({ where: { id: input.documentId, brandKey: BRAND_KEY }, include: { revisions: { orderBy: { version: "desc" }, take: 1 }, approvals: { where: { status: "PENDING" } } } });
      if (!before) throw new Error("Content document not found.");

      if (input.action === "save") {
        const nextVersion = (before.revisions[0]?.version ?? 0) + 1;
        const revision = await db.cmsRevision.create({ data: { documentId: before.id, version: nextVersion, payload: input.payload, changeSummary: input.changeSummary, createdBy: actor.sub } });
        await db.cmsApproval.updateMany({ where: { documentId: before.id, status: "PENDING" }, data: { status: "CANCELLED", decidedBy: actor.sub, decidedAt: new Date(), decisionNote: "Superseded by a newer revision." } });
        const after = await db.cmsDocument.update({ where: { id: before.id }, data: { activeRevisionId: revision.id, titleAr: input.titleAr, titleEn: input.titleEn, slug: input.slug === undefined ? undefined : input.slug ? slugify(input.slug) : null, status: "DRAFT", scheduledAt: null, updatedBy: actor.sub } });
        await db.auditLog.create({ data: auditData(actor.sub, "UPDATE", before.id, before, after, id, input.changeSummary) });
        return after;
      }

      if (!before.activeRevisionId) throw new Error("Document has no active revision.");

      if (input.action === "submit") {
        if (before.approvals.length) throw new Error("A pending approval already exists.");
        const approval = await db.cmsApproval.create({ data: { documentId: before.id, revisionId: before.activeRevisionId, requestedBy: actor.sub, decisionNote: input.note } });
        const after = await db.cmsDocument.update({ where: { id: before.id }, data: { status: "IN_REVIEW", updatedBy: actor.sub } });
        await db.auditLog.create({ data: auditData(actor.sub, "UPDATE", before.id, before, after, id, "Submitted for approval") });
        return { document: after, approval };
      }

      if (input.action === "approve" || input.action === "reject") {
        const approval = await db.cmsApproval.findFirst({ where: { id: input.approvalId, documentId: before.id, revisionId: before.activeRevisionId, status: "PENDING" } });
        if (!approval) throw new Error("Pending approval not found for the active revision.");
        const approved = input.action === "approve";
        await db.cmsApproval.update({ where: { id: approval.id }, data: { status: approved ? "APPROVED" : "REJECTED", decidedBy: actor.sub, decidedAt: new Date(), decisionNote: input.note } });
        const after = await db.cmsDocument.update({ where: { id: before.id }, data: { status: approved ? "APPROVED" : "DRAFT", updatedBy: actor.sub } });
        await db.auditLog.create({ data: auditData(actor.sub, approved ? "APPROVE" : "REJECT", before.id, before, after, id, input.note) });
        return after;
      }

      if (input.action === "publish" || input.action === "schedule") {
        const approval = await db.cmsApproval.findFirst({ where: { documentId: before.id, revisionId: before.activeRevisionId, status: "APPROVED" }, orderBy: { decidedAt: "desc" } });
        if (!approval) throw new Error("The active revision must be approved before publication.");
        const scheduledAt = input.action === "schedule" ? new Date(input.scheduledAt) : null;
        if (scheduledAt && scheduledAt <= new Date()) throw new Error("Schedule time must be in the future.");
        const after = await db.cmsDocument.update({ where: { id: before.id }, data: { status: scheduledAt ? "SCHEDULED" : "PUBLISHED", scheduledAt, publishedAt: scheduledAt ? before.publishedAt : new Date(), updatedBy: actor.sub } });
        await db.auditLog.create({ data: auditData(actor.sub, "UPDATE", before.id, before, after, id, scheduledAt ? "Publication scheduled" : "Published approved revision") });
        return after;
      }

      if (input.action === "rollback") {
        const revision = await db.cmsRevision.findFirst({ where: { id: input.revisionId, documentId: before.id } });
        if (!revision) throw new Error("Revision not found for this SALORA document.");
        const copy = await db.cmsRevision.create({ data: { documentId: before.id, version: (before.revisions[0]?.version ?? 0) + 1, payload: revision.payload, changeSummary: `Rollback: ${input.reason}`, createdBy: actor.sub } });
        const after = await db.cmsDocument.update({ where: { id: before.id }, data: { activeRevisionId: copy.id, status: "DRAFT", scheduledAt: null, updatedBy: actor.sub } });
        await db.auditLog.create({ data: auditData(actor.sub, "RESTORE", before.id, before, after, id, input.reason) });
        return after;
      }

      if (input.action !== "archive") throw new Error("Unsupported content workflow action.");
      const after = await db.cmsDocument.update({ where: { id: before.id }, data: { status: "ARCHIVED", archivedAt: new Date(), scheduledAt: null, updatedBy: actor.sub } });
      await db.auditLog.create({ data: auditData(actor.sub, "ARCHIVE", before.id, before, after, id, input.reason) });
      return after;
    });

    revalidatePath("/");
    revalidatePath("/menu");
    revalidatePath("/api/content");
    return responseJson(result, id, input.action === "create" ? 201 : 200);
  } catch (error) {
    return handleError(error, id);
  }
}
