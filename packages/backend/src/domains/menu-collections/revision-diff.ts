type JsonRecord = Record<string, unknown>;

export interface MenuRevisionDiffItem {
  key: string;
  before?: JsonRecord;
  after?: JsonRecord;
  changes?: string[];
}

export interface MenuRevisionDiff {
  compatible: boolean;
  warnings: string[];
  summary: {
    sectionsAdded: number;
    sectionsRemoved: number;
    sectionsChanged: number;
    productsAdded: number;
    productsRemoved: number;
    productsChanged: number;
  };
  sections: {
    added: MenuRevisionDiffItem[];
    removed: MenuRevisionDiffItem[];
    changed: MenuRevisionDiffItem[];
  };
  products: {
    added: MenuRevisionDiffItem[];
    removed: MenuRevisionDiffItem[];
    changed: MenuRevisionDiffItem[];
  };
}

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function number(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as JsonRecord)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function snapshotArray(snapshot: JsonRecord, key: "sections" | "products"): unknown[] {
  return Array.isArray(snapshot[key]) ? snapshot[key] as unknown[] : [];
}

function normalizeSection(value: unknown): JsonRecord {
  const section = record(value);
  return {
    id: text(section.id),
    key: text(section.key) ?? text(section.slug) ?? text(section.id) ?? "unknown-section",
    nameAr: text(section.nameAr),
    nameEn: text(section.nameEn),
    sortOrder: number(section.sortOrder),
    isActive: section.isActive !== false
  };
}

function normalizeProduct(value: unknown): JsonRecord {
  const row = record(value);
  const membership = record(row.membership);
  const product = Object.keys(record(row.product)).length ? record(row.product) : row;
  const category = record(product.category);

  const slug = text(product.slug)
    ?? text(row.slug)
    ?? text(row.productSlug)
    ?? text(product.id)
    ?? text(row.productId)
    ?? "unknown-product";

  return {
    id: text(product.id) ?? text(row.productId),
    slug,
    sectionId: text(membership.sectionId)
      ?? text(row.sectionId)
      ?? text(row.sectionKey)
      ?? text(row.categorySlug)
      ?? text(category.slug),
    sortOrder: number(membership.sortOrder ?? row.sortOrder),
    titleAr: text(membership.titleArOverride) ?? text(product.nameAr) ?? text(row.nameAr),
    titleEn: text(membership.titleEnOverride) ?? text(product.nameEn) ?? text(product.name) ?? text(row.nameEn),
    status: text(product.status) ?? text(row.status),
    price: product.basePrice ?? row.basePrice ?? row.price ?? null,
    isFeatured: Boolean(membership.isFeatured ?? row.isFeatured),
    badges: Array.isArray(membership.badges) ? membership.badges : Array.isArray(row.badges) ? row.badges : []
  };
}

function changedFields(before: JsonRecord, after: JsonRecord): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((key) => stable(before[key]) !== stable(after[key]));
}

function diffMap(
  beforeValues: unknown[],
  afterValues: unknown[],
  normalize: (value: unknown) => JsonRecord,
  identity: (value: JsonRecord) => string
) {
  const before = new Map(beforeValues.map((value) => {
    const normalized = normalize(value);
    return [identity(normalized), normalized] as const;
  }));
  const after = new Map(afterValues.map((value) => {
    const normalized = normalize(value);
    return [identity(normalized), normalized] as const;
  }));

  const added: MenuRevisionDiffItem[] = [];
  const removed: MenuRevisionDiffItem[] = [];
  const changed: MenuRevisionDiffItem[] = [];

  for (const [key, value] of after) {
    const previous = before.get(key);
    if (!previous) {
      added.push({ key, after: value });
      continue;
    }
    const changes = changedFields(previous, value);
    if (changes.length) changed.push({ key, before: previous, after: value, changes });
  }

  for (const [key, value] of before) {
    if (!after.has(key)) removed.push({ key, before: value });
  }

  return { added, removed, changed };
}

export function diffMenuRevisionSnapshots(left: unknown, right: unknown): MenuRevisionDiff {
  const leftSnapshot = record(left);
  const rightSnapshot = record(right);
  const warnings: string[] = [];

  const leftVersion = leftSnapshot.contractVersion ?? leftSnapshot.schemaVersion ?? null;
  const rightVersion = rightSnapshot.contractVersion ?? rightSnapshot.schemaVersion ?? null;

  if (leftVersion !== rightVersion) {
    warnings.push(`Snapshot contract differs: ${String(leftVersion)} -> ${String(rightVersion)}.`);
  }
  if (leftSnapshot.contractVersion !== 2 || rightSnapshot.contractVersion !== 2) {
    warnings.push("One or both revisions use a legacy snapshot shape; the diff is normalized best-effort.");
  }

  const sections = diffMap(
    snapshotArray(leftSnapshot, "sections"),
    snapshotArray(rightSnapshot, "sections"),
    normalizeSection,
    (value) => String(value.key)
  );
  const products = diffMap(
    snapshotArray(leftSnapshot, "products"),
    snapshotArray(rightSnapshot, "products"),
    normalizeProduct,
    (value) => String(value.slug)
  );

  return {
    compatible: warnings.length === 0,
    warnings,
    summary: {
      sectionsAdded: sections.added.length,
      sectionsRemoved: sections.removed.length,
      sectionsChanged: sections.changed.length,
      productsAdded: products.added.length,
      productsRemoved: products.removed.length,
      productsChanged: products.changed.length
    },
    sections,
    products
  };
}
