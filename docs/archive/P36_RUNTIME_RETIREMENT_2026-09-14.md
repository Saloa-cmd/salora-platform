# P36 runtime retirement

P36 was the historical activation package that moved SALORA from an earlier fixed catalogue state. The current authority is the immutable published revision selected by the collection pointer. Runtime code must not assume an old product count or revision number.

Retired from runtime on 2026-09-14:

- `/api/control-tower/p36-activate117`
- `/api/control-tower/p36-production-data-prep`
- `P36ActivationReview`
- `SimpleLaunchOperationsCenter`
- the P36 activation manifest and its server services
- the P36 candidate gate embedded in the generic product mutation route

The historical documentation and Git history remain available as audit evidence. Historical tests are named with the `archive:` prefix and are not part of release assertions. Static candidate media is retained because immutable historical evidence may reference its checksums; it is not a runtime activation source.

The supported operator path is now Catalog Workspace plus Menu Authority. It discovers the complete current catalogue through a paginated server contract and uses the published revision's dynamic count, ID, version and checksum.

Rollback is a normal code revert of this retirement commit. Reverting would reintroduce obsolete callable routes, so it must only be considered as an audited emergency action and never as a catalogue rollback. Catalogue rollback remains the Menu Authority publication workflow.
