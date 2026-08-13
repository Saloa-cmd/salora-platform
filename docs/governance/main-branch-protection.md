# SALORA Main Branch Governance

## Status

- Repository: `Saloa-cmd/salora-platform`
- Default branch: `main`
- Ruleset: `SALORA Main Governance`
- Ruleset ID: `20793910`
- Enforcement: `active`
- Baseline SHA: `f313f5c5cfff4a6765b13a6fbb26b3b12174e924`
- Applied: `2026-08-13`
- Ruleset URL: <https://github.com/Saloa-cmd/salora-platform/rules/20793910>

## Scope

This policy protects `refs/heads/main`. It governs how changes reach the default
branch without changing application runtime, production configuration, or data.

## Pull Request Policy

- A pull request is required before changes reach `main`.
- Direct pushes to `main` are not permitted.
- Review conversations must be resolved before merge.
- Required approving review count is currently `0`.
- Code owner approval is not currently required because no operational
  `CODEOWNERS` policy exists.
- The allowed repository merge methods remain `merge`, `squash`, and `rebase`.

The zero-approval policy avoids deadlocking a repository currently administered
by one maintainer. Approval requirements should be increased when an additional
active reviewer is available.

## Required Status Checks

The following GitHub Actions check contexts are required:

- `verify`
- `mobile`

Strict synchronization with the latest `main` commit is not currently required.
This avoids unnecessary CI races while still requiring both checks on the pull
request commit.

CircleCI is not authoritative and is not a required check. GitHub Actions is the
official SALORA CI path.

## History Protection

- Force pushes are blocked by the `non_fast_forward` rule.
- Deletion of `main` is blocked by the `deletion` rule.
- Pull-request enforcement prevents direct update of `main`.
- No permanent bypass actors are configured.
- GitHub reports `current_user_can_bypass: never`.

## CircleCI Disposition

The repository has no `.circleci/config.yml`, and CircleCI is not included in
the required status contexts. Any remaining CircleCI error is external
integration noise and does not represent SALORA CI status.

If the noise persists, an administrator should separately review the CircleCI
GitHub App/project integration and disable the unused project association.
Do not add a synthetic CircleCI configuration merely to produce a green check.

## Validation

The effective rules for `main` were verified through GitHub repository-rule
metadata:

- `deletion`
- `pull_request`
- `required_status_checks`
- `non_fast_forward`

GitHub reports the `main` branch as protected.

Potentially destructive tests such as force-pushing or deleting `main` are not
performed. Ruleset metadata is the validation evidence for those controls.

## Emergency Procedure

If the ruleset causes an operational deadlock:

1. Confirm the failure is caused by governance rather than application code.
2. Record the failing check and affected pull request.
3. Use repository administration access to amend the smallest necessary rule.
4. Do not add a permanent bypass as the normal merge path.
5. Restore the intended policy after the incident.
6. Record the change and rationale in repository documentation.

## Production Safety

- No production application code was changed by the governance operation.
- No production deployment was manually initiated.
- No production environment variable was changed.
- No production database connection or write was performed.
- No migration, DDL, DML, snapshot, or preflight was executed.
- No Menu Authority publication or activation was performed.