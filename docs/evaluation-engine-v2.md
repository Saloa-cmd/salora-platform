# Evaluation Engine v2

Evaluation v2 provides deterministic grounded scoring for every AI response without external AI judges.

## Scores

- Accuracy
- Recommendation quality
- Safety
- Latency
- Cost efficiency
- Overall score

## Grounding

The evaluator checks SALORA domain vocabulary, forbidden operational leakage, provider metadata, usage metadata, and request intent. It is intentionally deterministic so tests can run without credentials.

## Next Step

Future phases can add persisted evaluation records and optional judge-based evaluation once provider credentials and governance approval exist.
