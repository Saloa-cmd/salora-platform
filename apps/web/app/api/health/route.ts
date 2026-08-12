import {
  createPublicOperationalStatus,
  PUBLIC_OPERATIONAL_STATUS_HEADERS
} from "@/lib/server/publicOperationalStatus";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    createPublicOperationalStatus({ status: "ok" }),
    {
      status: 200,
      headers: PUBLIC_OPERATIONAL_STATUS_HEADERS
    }
  );
}
