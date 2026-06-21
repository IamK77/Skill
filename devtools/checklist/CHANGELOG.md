# Changelog

## [0.4.1](https://github.com/IamK77/Skill/compare/v0.4.0...v0.4.1) (2026-06-21)


### Features

* **checklist:** add 'checklist lint' — yml schema + SKILL.md parity gate ([b65ebf9](https://github.com/IamK77/Skill/commit/b65ebf9a246d2e906a520a370d71e469d14c9301))
* **checklist:** evidence-required checks, run journal, report & show --json ([8d0ab99](https://github.com/IamK77/Skill/commit/8d0ab992053e7076de307d9bf7560169d0d5370a))
* **checklist:** parameterize verify rules via init --var and ${var} interpolation ([32d82ec](https://github.com/IamK77/Skill/commit/32d82ec75c2f5661db7d31571be7a486bb2eff91))


### Bug Fixes

* **checklist:** key the active pointer per session so concurrent runs don't clobber ([120d566](https://github.com/IamK77/Skill/commit/120d566c769a4271df6080eecc807913e1119609))

## [0.4.0](https://github.com/IamK77/Skill/compare/v0.3.0...v0.4.0) (2026-06-18)


### ⚠ BREAKING CHANGES

* **checklist:** existing in-skill-dir .checklist.state.json files are abandoned (not migrated); init surfaces a one-line note when it finds one and the file is safe to delete.

### Features

* **checklist:** relocate state to XDG dir, key by (skill,target) and phase name ([b7757df](https://github.com/IamK77/Skill/commit/b7757df244d7007bd2d337e7360cfd6be0fdd1c1))


### Bug Fixes

* **checklist:** default the run target to the project cwd, not the skill dir ([ea69aec](https://github.com/IamK77/Skill/commit/ea69aec62875ba6fafad5c32b8617f9c19422627))

## [0.3.0](https://github.com/IamK77/Skill/compare/v0.2.1...v0.3.0) (2026-06-10)


### ⚠ BREAKING CHANGES

* **engines:** requires Node >= 20

### Bug Fixes

* **loader:** reject non-string verify and non-mapping list entries with located errors ([4abe8d1](https://github.com/IamK77/Skill/commit/4abe8d1c81ce59beaf2653315fd5f258113fe7f8))
* **resolver:** only treat pure digit strings as phase indexes ([ef41d54](https://github.com/IamK77/Skill/commit/ef41d546b998efb54ffaed75ff7c4defe501dcf9))
* **runner:** attribute handler crashes to their check instead of aborting the verify batch ([fc04f2d](https://github.com/IamK77/Skill/commit/fc04f2dcca5be65ee2dfd957927c809dcacfbe81))
* **runner:** exec scripts via execFileSync argv so paths with spaces/metacharacters work ([cd49f4d](https://github.com/IamK77/Skill/commit/cd49f4d6b6a71c2cdc5cbb80ee0267032db52745))
* **state:** atomic state writes and read-merge-save so concurrent runs cannot lose records ([61ed908](https://github.com/IamK77/Skill/commit/61ed908ed09c49b60341288cd2293c1c2853d835))


### Miscellaneous Chores

* **engines:** require Node &gt;= 20 ([1a4d2b2](https://github.com/IamK77/Skill/commit/1a4d2b26ee41fd4775b6bac6475bd69e66374e72))

## [0.2.1](https://github.com/IamK77/Skill/compare/a184eb4b3ed6131db60db01ff918b8fa43e5a975...v0.2.1) (2026-06-09)


### Bug Fixes

* **checklist:** give a clear error when run before the dist build exists ([cf4b27e](https://github.com/IamK77/Skill/commit/cf4b27e0b98132423ceebad4564d598b55208939))
