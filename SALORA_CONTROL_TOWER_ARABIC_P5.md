# SALORA Control Tower — Arabic No-Code P5

## Delivered

- Arabic-first Control Tower with complete RTL shell behavior.
- Persistent Arabic/English language switch stored per browser.
- Bilingual navigation, section headings, capability status, core governance language, and live operator forms.
- Secure sign-out from the Control Tower header.
- Arabic live product operations for price, state, image URL, and bilingual content.
- Visual product configuration editor for variants, add-ons, and modifier groups; operators no longer edit JSON.
- Visual notification payload fields and runtime configuration value controls; operators no longer edit JSON.
- Existing RBAC, SALORA catalog isolation, atomic writes, activity logs, and audit logs remain intact.

## Production truth

Capabilities marked live remain backed by the existing SALORA APIs. Capabilities that still require a domain API remain visibly marked as requiring backend completion and are not presented as live controls.

## Validation

- Web TypeScript: passed.
- Mobile TypeScript: passed.
- ESLint: passed.
- Full `pnpm test`: passed.
- SALORA menu verification: 117 bilingual products across 17 categories.
- Auth, infrastructure, business domain, AI, omnichannel, production activation, go-live, revenue, and operations tests: passed.

## Apply

Extract the update at the repository root, review the listed files, then run:

```powershell
pnpm test
git add -- "SALORA_CONTROL_TOWER_ARABIC_P5.md" "apps/web/components/control-tower/ControlTowerLocale.tsx" "apps/web/components/control-tower/ControlTowerShell.tsx" "apps/web/components/control-tower/CapabilityCard.tsx" "apps/web/components/control-tower/ControlTowerView.tsx" "apps/web/components/control-tower/NoCodeActionPanel.tsx" "apps/web/components/control-tower/SimpleLaunchOperationsCenter.tsx"
git commit -m "feat: add Arabic no-code SALORA control tower"
git push
```
