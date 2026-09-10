import { NextResponse } from "next/server";
import { getMenuAuthoritySnapshot, MenuAuthorityUnavailableError } from "@/lib/server/menuAuthority";

export const dynamic = "force-dynamic";

const SITE_ORIGIN = "https://salora-platform.vercel.app";

function csv(value: unknown) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function httpsUrl(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return /^https:\/\//i.test(text) ? text : "";
}

export async function GET() {
  try {
    const snapshot = await getMenuAuthoritySnapshot();
    const header = [
      "id",
      "title",
      "description",
      "availability",
      "condition",
      "price",
      "link",
      "image_link",
      "brand",
      "product_type"
    ];

    const rows = snapshot.products.flatMap((product) => {
      const image = httpsUrl(product.visual);
      if (!image || !Number.isFinite(product.price) || product.price <= 0) return [];

      const title = product.nameAr
        ? `${product.nameAr} — ${product.nameEn ?? product.name}`
        : (product.nameEn ?? product.name);
      const description = product.descriptionAr
        ?? product.descriptionEn
        ?? product.description
        ?? title;
      const link = `${SITE_ORIGIN}/menu?product=${encodeURIComponent(product.id)}`;

      return [[
        product.catalogId ?? product.id,
        title,
        description,
        "in stock",
        "new",
        `${product.price.toFixed(3)} OMR`,
        link,
        image,
        "SALORA",
        product.categoryAr ?? product.categoryEn ?? product.category ?? "Menu"
      ].map(csv).join(",")];
    });

    const body = `\uFEFF${header.join(",")}\n${rows.join("\n")}\n`;
    const response = new NextResponse(body, { status: 200 });
    response.headers.set("content-type", "text/csv; charset=utf-8");
    response.headers.set("content-disposition", "inline; filename=salora-meta-catalog.csv");
    response.headers.set("cache-control", "public, s-maxage=300, stale-while-revalidate=600");
    response.headers.set("x-salora-menu-source", snapshot.source);
    response.headers.set("x-salora-menu-revision", snapshot.revision?.id ?? "legacy-catalog");
    response.headers.set("x-salora-feed-items", String(rows.length));
    return response;
  } catch (error) {
    const status = error instanceof MenuAuthorityUnavailableError ? 503 : 500;
    return NextResponse.json(
      { error: status === 503 ? "Published menu authority is not available." : "Catalog feed could not be generated." },
      { status, headers: { "retry-after": "60" } }
    );
  }
}
