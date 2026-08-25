# P34 Preview Gate

The P34 merge gate requires all of the following on the exact PR head SHA:

- SALORA CI / mobile — PASS
- SALORA CI / verify — PASS
- lint — PASS
- full tests — PASS
- web build — PASS
- Playwright browser smoke — PASS
- critical dependency audit — PASS
- Vercel Preview — READY

CircleCI is not a P34 gate because the repository has no active CircleCI configuration; GitHub Actions is the canonical CI system.
