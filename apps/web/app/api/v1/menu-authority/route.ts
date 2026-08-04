import { NextResponse, type NextRequest } from "next/server";
import { getMenuAuthoritySnapshot, MenuAuthorityUnavailableError } from "@/lib/server/menuAuthority";

export const dynamic = "force-dynamic";

function positiveInteger(value: string | null, fallback: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, maximum) : fallback;
}

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    const snapshot = await getMenuAuthoritySnapshot();
    const params = request.nextUrl.searchParams;
    const query = params.get("q")?.trim().toLocaleLowerCase("ar") ?? "";
    const section = params.get("section")?.trim() ?? "";
    const category = params.get("category")?.trim().toLocaleLowerCase("ar") ?? "";
    const tag = params.get("tag")?.trim().toLocaleLowerCase("ar") ?? "";
    const featured = params.get("featured");
    const offset = positiveInteger(params.get("offset"), 0, 10000);
    const limit = positiveInteger(params.get("limit"), 117, 117);

    const filtered = snapshot.products.filter((product) => {
      if (section && product.sectionKey !== section) return false;
      if (category) {
        const categories = [product.category, product.categoryAr, product.categoryEn]
          .filter(Boolean)
          .map((value) => String(value).toLocaleLowerCase("ar"));
        if (!categories.includes(category)) return false;
      }
      if (tag && !product.tags.some((value) => value.toLocaleLowerCase("ar") === tag)) return false;
      if (featured === "true" && !product.featured) return false;
      if (featured === "false" && product.featured) return false;
      if (!query) return true;
      const haystack = [
        product.name,
        product.nameAr,
        product.nameEn,
        product.category,
        product.categoryAr,
        product.categoryEn,
        product.description,
        product.descriptionAr,
        product.descriptionEn,
        ...product.tags,
        ...(product.badges ?? [])
      ].filter(Boolean).join(" ").toLocaleLowerCase("ar");
      return haystack.includes(query);
    });
    const products = filtered.slice(offset, offset + limit);
    const etag = snapshot.revision ? `"${snapshot.revision.checksum}"` : `"legacy-${snapshot.generatedAt}"`;

    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          "etag": etag,
          "x-request-id": requestId,
          "x-salora-menu-source": snapshot.source
        }
      });
    }

    const response = NextResponse.json({
      requestId,
      data: {
        collection: snapshot.collection,
        revision: snapshot.revision,
        sections: snapshot.sections,
        products,
        pagination: {
          offset,
          limit,
          total: filtered.length,
          hasMore: offset + products.length < filtered.length
        }
      },
      runtime: {
        source: snapshot.source,
        stale: snapshot.stale,
        mode: snapshot.runtimeMode,
        databaseHealth: snapshot.databaseHealth,
        generatedAt: snapshot.generatedAt
      }
    });

    response.headers.set("etag", etag);
    response.headers.set("cache-control", "public, s-maxage=60, stale-while-revalidate=300");
    response.headers.set("x-request-id", requestId);
    response.headers.set("x-salora-menu-source", snapshot.source);
    response.headers.set("x-salora-menu-revision", snapshot.revision?.id ?? "legacy-catalog");
    response.headers.set("x-salora-menu-version", String(snapshot.revision?.version ?? 0));
    return response;
  } catch (error) {
    const status = error instanceof MenuAuthorityUnavailableError ? 503 : 500;
    return NextResponse.json(
      { requestId, error: status === 503 ? "Published menu authority is not available." : "Menu authority could not be loaded." },
      { status, headers: { "x-request-id": requestId, "retry-after": "60" } }
    );
  }
}
