# Releasing `@iamk77/skill-checklist`

Releases are **automated**. You don't run `npm publish` by hand, and there is no
npm token to manage. The flow is driven by [release-please][rp] and published to
npm with [OIDC trusted publishing][tp] from GitHub Actions.

## The normal flow (what you do)

1. **Write Conventional Commits** that touch `devtools/checklist/`. The commit
   type decides the next version:

   | Commit | Example | Bump below 1.0 |
   |---|---|---|
   | `fix:` | `fix(checklist): reset no longer deletes an unrelated state file` | patch (0.2.0 → 0.2.1) |
   | `feat:` | `feat(checklist): add a --json output flag` | patch (0.2.0 → 0.2.1) |
   | `feat!:` or a `BREAKING CHANGE:` footer | `feat(checklist)!: rename the active-pointer env var` | minor (0.2.0 → 0.3.0) |
   | `docs:` / `chore:` / `refactor:` / `test:` | — | no release on their own |

   These pre-1.0 rules come from `bump-minor-pre-major: true` and
   `bump-patch-for-minor-pre-major: true` in the root
   [release configuration](../../release-please-config.json). At 1.0 and later,
   features bump minor and breaking changes bump major.

   Only commits that change files under `devtools/checklist/` count toward this
   package's version. A commit that only edits `skills/` or the root README will
   not trigger a checklist release.

2. **Merge to `main`.** On every push to main, the `release-please` workflow
   opens (or updates) a PR titled like `chore(main): release checklist 0.3.0`.
   That PR bumps `package.json` and writes `CHANGELOG.md` — review it like any PR.
   On that release branch, regenerate the committed standalone artifact after
   the version bump:

   ```sh
   cd devtools/checklist
   npm ci
   npm run bundle
   npm run bundle:check
   npm test
   ```

   Review and commit `bundle/checklist.mjs` on the release branch. Repeat if
   release-please changes the version or source again. It does not run the
   bundle generator for you.

3. **Merge the release PR only after its current head passes CI and bundle
   checks.** If a workflow awaits maintainer approval, approve it and inspect
   its completed result first; missing or pending checks are not a green suite.
   Requiring these checks for merge is a separate repository setting.
   Merging is the release trigger. release-please tags
   the commit (`v0.3.0`) and cuts a GitHub Release, then the `publish` job builds,
   tests, and publishes to npm via OIDC. Watch it under the repo's **Actions** tab.

4. **Verify:** `npm view @iamk77/skill-checklist version`.

The compiled npm CLI reads its version from `package.json` at runtime. The
standalone bundle embeds that version at build time, so even a version-only
change requires regeneration. `npm test` includes the bundle freshness check;
the publish job fails rather than publishing with a stale committed bundle.
That job runs after the GitHub tag/release is created, so catch staleness in the
release PR, not after merging it.

## One-time setup (required before the first automated publish)

Both of these are on GitHub/npm settings — they can't be done from code:

1. **Let Actions open the release PR.** Repo → **Settings → Actions → General →
   Workflow permissions** → select **Read and write permissions** and tick
   **Allow GitHub Actions to create and approve pull requests**.

2. **Register the npm Trusted Publisher.** npmjs.com → the package
   **@iamk77/skill-checklist** → **Settings → Trusted Publisher → GitHub Actions**,
   and fill in:
   - Organization or user: `IamK77`
   - Repository: `Skill`
   - Workflow filename: `release-please.yml`
   - Environment: *(leave blank)*

   This authorizes that exact workflow to publish without a token. Until it's
   set, the `publish` job fails with an auth error (the release PR + tag still
   work; just re-run the job after configuring).

## Manual fallback

If CI is down and you must publish by hand, you need an OTP — so first add an
**Authenticator app** under npmjs.com → Account → Two-Factor Authentication
(the account currently has only a passkey, which can't produce a CLI code). Then:

```sh
cd devtools/checklist
npm run build && npm test
npm publish --dry-run        # sanity-check the contents
npm publish --otp=123456     # 6-digit code from the authenticator app
```

A given version number can only be published once — bump it, don't try to
overwrite.

[rp]: https://github.com/googleapis/release-please
[tp]: https://docs.npmjs.com/trusted-publishers
