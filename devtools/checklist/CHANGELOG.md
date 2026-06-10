# Changelog

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
