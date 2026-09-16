import { type NextRequest } from "next/server";
import { getPrismaClient } from "@salora/backend";
import { z } from "zod";
import { responseError, responseJson } from "@/lib/server/domainHttp";
import { handleError, parseBody, requireControlPermission, requestId, writeActivity } from "@/lib/server/simpleLaunchControl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({ decision: z.enum(["APPROVED", "REJECTED"]), notes: z.string().trim().max(1200).optional() });
type JobRow = { id: string; state: string };

export async function POST(request: NextRequest, context: { params: Promise<{ jobId: string }> }) {
  const id = requestId(request);
  try {
    const actor = await requireControlPermission(request, "catalog:write");
    const parsed = await parseBody(request, schema);
    if (!parsed.success) return responseError("Invalid review decision.", id, 400);
    const { jobId } = await context.params;
    if (!z.string().uuid().safeParse(jobId).success) return responseError("Invalid render job.", id, 400);

    const prisma = getPrismaClient();
    const existing = await prisma.$queryRawUnsafe<JobRow[]>(`SELECT id,state::text AS state FROM media_render_jobs WHERE id=$1::uuid LIMIT 1`, jobId);
    const job = existing[0];
    if (!job) return responseError("Render job not found.", id, 404);
    if (!["DRAFT", "REVIEW", "REJECTED"].includes(job.state)) return responseError("This render job cannot be reviewed in its current state.", id, 409);

    const next = parsed.data.decision;
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`INSERT INTO creative_reviews (render_job_id,reviewer_id,decision,notes,decided_at) VALUES ($1::uuid,$2::uuid,$3::creative_review_decision,$4,now())`, jobId, actor.sub, next, parsed.data.notes ?? null);
      if (next === "APPROVED") await tx.$executeRawUnsafe(`UPDATE media_render_jobs SET state='APPROVED',approved_by=$2::uuid,approved_at=now(),updated_at=now() WHERE id=$1::uuid`, jobId, actor.sub);
      else await tx.$executeRawUnsafe(`UPDATE media_render_jobs SET state='REJECTED',approved_by=NULL,approved_at=NULL,updated_at=now() WHERE id=$1::uuid`, jobId);
      await tx.$executeRawUnsafe(`INSERT INTO media_audit_events (render_job_id,actor_id,action,from_state,to_state,metadata) VALUES ($1::uuid,$2::uuid,$3,$4::media_render_state,$5::media_render_state,$6::jsonb)`, jobId, actor.sub, next === "APPROVED" ? "HUMAN_APPROVE" : "HUMAN_REJECT", job.state, next, JSON.stringify({ requestId: id, notes: parsed.data.notes ?? null }));
    });
    await writeActivity({ actorId: actor.sub, action: next === "APPROVED" ? "mediaStudio.approve" : "mediaStudio.reject", entityType: "MediaRenderJob", entityId: jobId, requestId: id });
    return responseJson({ id: jobId, state: next, humanApproved: next === "APPROVED" }, id);
  } catch (error) {
    return handleError(error, id);
  }
}
