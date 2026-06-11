import type { Product } from "@salora/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-luxury transition duration-300 hover:-translate-y-1 hover:border-gold/35">
      <div className="product-visual aspect-[4/3]" aria-hidden="true" />
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-goldSoft">{product.category}</p>
          <h3 className="mt-2 text-xl font-semibold text-cream">{product.name}</h3>
        </div>
        <p className="whitespace-nowrap rounded-full border border-gold/25 px-3 py-1 text-sm text-goldSoft">OMR {product.price.toFixed(3)}</p>
      </div>
      <p className="mt-3 min-h-20 text-sm leading-7 text-muted">{product.story ?? product.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {product.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-white/[0.055] px-3 py-1 text-xs text-muted">
            {tag}
          </span>
        ))}
      </div>
      {product.pairing ? <p className="mt-4 text-sm text-goldSoft">Best paired with {product.pairing}</p> : null}
    </article>
  );
}
