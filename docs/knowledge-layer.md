# Knowledge Layer

The Knowledge Layer gives AI Concierge a controlled source of SALORA facts instead of relying only on prompts.

## Sources

- Products
- Categories
- Loyalty rules
- Offers
- FAQs
- Policies
- Business rules

## Current Mode

Phase 4.5 uses an in-process repository with lexical retrieval and relevance scoring. It is RAG-ready but does not require a vector database.

## Governance

The layer stores business-safe summaries only. It must not include raw secrets, infrastructure details, unredacted customer records, or private system prompts.
