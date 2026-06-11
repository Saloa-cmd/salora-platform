"use client";

import { recommendFromPrompt, products } from "@salora/data";
import { Bot, Send } from "lucide-react";
import { useState } from "react";

const prompts = ["I want something cold", "Sweet coffee", "Matcha please", "Dessert pairing"];

export function ConciergePreview() {
  const [input, setInput] = useState("I want something cold");
  const reply = recommendFromPrompt(input);
  const suggestions = products.filter((product) => reply.productIds.includes(product.id)).slice(0, 3);
  const quickReplies = reply.quickReplies ?? prompts;

  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-4 shadow-glow backdrop-blur">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <span className="grid size-10 place-items-center rounded-full bg-gold/15 text-goldSoft">
          <Bot size={18} />
        </span>
        <div>
          <p className="font-semibold text-cream">SALORA Concierge</p>
          <p className="text-xs text-muted">Local Phase 1 recommendation logic</p>
        </div>
      </div>
      <div className="space-y-4 py-5">
        <div className="ml-auto max-w-[82%] rounded-lg bg-gold/15 px-4 py-3 text-sm text-cream">{input}</div>
        <div className="max-w-[88%] rounded-lg bg-white/[0.06] px-4 py-3 text-sm leading-6 text-muted">
          <div className="mb-3" aria-label="SALORA Concierge is composing a recommendation">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
          {reply.message}
        </div>
        {suggestions.length > 0 ? (
          <div className="grid gap-2">
            {suggestions.map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <span>
                  <span className="block text-sm text-cream">{product.name}</span>
                  <span className="block text-xs text-muted">{product.pairing ? `Pairs with ${product.pairing}` : product.category}</span>
                </span>
                <span className="text-xs text-goldSoft">OMR {product.price.toFixed(3)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 pb-4">
        {quickReplies.map((prompt) => (
          <button key={prompt} className="rounded-full border border-white/10 px-3 py-2 text-xs text-muted transition hover:border-gold/30 hover:text-cream" onClick={() => setInput(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
        <span className="sr-only">Ask SALORA Concierge</span>
        <input value={input} onChange={(event) => setInput(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-cream outline-none placeholder:text-muted" placeholder="Tell us your mood" />
        <Send size={16} className="text-goldSoft" />
      </label>
    </div>
  );
}
