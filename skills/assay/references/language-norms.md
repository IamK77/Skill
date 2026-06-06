# Language-Specific Testing Norms

This document is loaded during SURVEY once the target's language is known, and its conventions are ENFORCED at the BUILD gate. It deliberately covers only what an agent does NOT do by default — the framework-idiomatic habits, hidden footguns, and must-run commands that get skipped — not general testing theory.

## How to use

1. **Detect the target language** from build files (`go.mod`, `Cargo.toml`, `pom.xml`/`build.gradle`, `*.csproj`, `Gemfile`, `pyproject.toml`/`setup.cfg`, `package.json`, `CMakeLists.txt`), file extensions, and where existing tests live.
2. **Open that language's section** and apply its norms while writing.
3. **RUN its must-run commands** before declaring done — see the cheat-sheet at the end for the ones agents forget.

If a project mixes languages (e.g. Kotlin under JVM, TS in a Python repo), apply each section to its own files.

## Universal blind spots (every language)

These cut across all languages and agents skip them regardless of stack — they are assumed in every section below, so the per-language lists don't repeat them:

- **Restore/teardown every double, fixture, temp dir, and env mutation** with the framework's auto-cleanup primitive so state never leaks into later tests. A leaked mock/global is the #1 source of order-dependent flakes.
- **Never `sleep` on the wall clock to synchronize.** Poll a condition with a timeout, use fake timers / virtual time, or signal completion. Real sleeps are slow and flaky.
- **Assert error IDENTITY (type / variant / code / cause), not message strings.** String matching breaks on rewording, wrapping, and i18n, and passes on unrelated same-text errors.
- **Parametrize cases; don't loop.** A `for` loop reports one opaque result and stops at the first failure. Use the framework's table/parametrize primitive so each case is named and runs independently.
- **Run the strictest checker the toolchain offers** — type-checker, race/UB sanitizers, lint with warnings-as-errors — in the same gate as the tests. Tests don't catch what these do.
- **Pin the seed and the clock.** Inject/freeze time; keep test-order randomization ON to surface inter-test leakage, and reproduce failures from the printed seed.
- **Test observable behavior, not private internals**, so refactors don't break tests spuriously.
- **Confirm tests were actually discovered and RAN** — a stale runner or zero-discovery reports green having run nothing.

## Python

Framework: **pytest** (plain `assert`, fixtures, `parametrize`). Run: `pytest -q` (add `-p no:cacheprovider` in CI). Mocking via stdlib `unittest.mock`.

### Blind spots an agent must be told

- **Patch where it's *used*, not where it's defined.** `mock.patch` rebinds a name in a namespace; the importing module holds its own reference.
  ```python
  # app/service.py does: from app.clock import now
  patch("app.service.now")      # right — the name service looked up
  patch("app.clock.now")        # wrong — service already bound the old ref
  ```
- **`autospec=True` (or `spec=`) on every patch.** A bare `Mock` accepts any call/attribute, so it silently passes after the real signature changes — defeating the test.
  ```python
  with patch("app.service.send", autospec=True) as send:
      ...  # send(1, 2, 3) now raises if real send() took 2 args
  ```
- **`pytest.raises(match=...)` instead of catching the bare type.** `match` is `re.search`, so escape regex metachars; assert on a custom attribute (`exc.code == "E_QUOTA"`) over `str(exc)`.
  ```python
  with pytest.raises(ValueError, match=r"id must be > 0"):
      parse(-1)
  ```
- **Use builtin fixtures, don't roll your own.** `tmp_path` (per-test dir, auto-cleaned), `monkeypatch` (auto-undone env/attr/cwd), `capsys` (stdout/stderr), `caplog` (log records). Avoid `os.environ[...]=` / manual `tempfile`.
  ```python
  def test_env(monkeypatch, tmp_path):
      monkeypatch.setenv("HOME", str(tmp_path))  # reverted automatically
  ```
- **`caplog` needs a level and asserts on records, not formatted text.** Without `set_level`/`at_level` nothing is captured; assert on `r.levelno`/`r.message` in `caplog.records`.
- **Freeze time with `freezegun`/`time-machine` or inject the clock** — never call real `datetime.now()` in assertions (flaky, timezone-dependent).
- **Mock async with `AsyncMock`; `await` every coroutine.** A plain `Mock` returns a non-awaited coroutine that warns and never runs. Mark tests `@pytest.mark.anyio`/`asyncio`.
  ```python
  client.fetch = AsyncMock(return_value={"ok": True})
  assert (await service.run()) == "ok"
  ```
- **Put shared fixtures in `conftest.py`, and mind `scope=`.** A `scope="session"` fixture that mutates state leaks between tests; default `function` scope is the safe choice unless setup is expensive.
- **Property-based tests for invariants (Hypothesis).** Example-based tests miss edge cases (empty, unicode, huge ints).
  ```python
  @given(st.lists(st.integers()))
  def test_sort_idempotent(xs): assert sorted(sorted(xs)) == sorted(xs)
  ```
- **Turn warnings into failures.** Set `filterwarnings = error` in config so un-awaited coroutines and `DeprecationWarning`/`RuntimeWarning` fail rather than hide bugs; assert intentional ones with `pytest.warns(...)`/`recwarn`.
- **`mypy`/`pyright` is a test gate, not optional.** Run it in the same CI step.

### Must-run

`pytest -q -p no:cacheprovider -W error` (warnings-as-errors), then `mypy .` (or `pyright`). Keep `pytest-randomly` ON to surface inter-test state leakage; coverage with `pytest --cov --cov-fail-under=N`.

## TypeScript / JavaScript

Framework: **Vitest** (default for new code) or **Jest**; `node:test` for zero-dep Node. Run: `vitest run` (CI/one-shot, NOT bare `vitest` which watches) / `jest` / `node --test`.

### Blind spots an agent must be told

- **Know the restore semantics:** `clear` wipes call history, `reset` wipes history + impl, `restore` puts the *original* back. Set `restoreMocks: true` in config; only `vi.spyOn`/auto-spies are restorable — a `vi.fn()` you stored yourself is not.
  ```ts
  afterEach(() => { vi.restoreAllMocks() }) // jest: jest.restoreAllMocks()
  ```
- **Await async assertions — a floating promise gives a false pass.** `expect(p).rejects/.resolves` return promises; forget `await`/`return` and a *failing* assertion is reported late, on the wrong test, or after the run.
  ```ts
  await expect(load()).rejects.toThrow('boom')   // not: expect(load()).rejects...
  ```
- **Use `expect.assertions(n)` for try/catch and conditional async paths**, so a branch that never runs (e.g. the code didn't throw) fails instead of silently passing.
  ```ts
  it('throws', async () => {
    expect.assertions(1)
    try { await danger() } catch (e: any) { expect(e.message).toBe('nope') }
  })
  ```
- **`vi.mock` is hoisted above imports; its factory CANNOT close over outer variables.** `const m = vi.fn(); vi.mock('x', () => ({ f: m }))` throws "Cannot access 'm' before initialization". Use `vi.hoisted`.
  ```ts
  const { f } = vi.hoisted(() => ({ f: vi.fn() }))
  vi.mock('./api', () => ({ fetchUser: f }))
  ```
- **ESM module mocks need the right shape.** With a default export, return `{ default: ... }`. To partially mock, spread the real module: `vi.mock('./m', async (orig) => ({ ...await orig(), foo: vi.fn() }))`. `vi.doMock` is the non-hoisted variant for per-test impls.
- **Drive time with fake timers.** Restore with `afterEach(() => vi.useRealTimers())`.
  ```ts
  vi.useFakeTimers()
  schedule()
  vi.advanceTimersByTime(1000)          // or vi.runAllTimers()
  await vi.advanceTimersByTimeAsync(0)  // flush awaited microtasks under fake timers
  ```
- **Assert error identity / `.cause`, not message substrings.**
  ```ts
  await expect(fn()).rejects.toBeInstanceOf(ValidationError)
  expect((err as Error).cause).toBe(rootErr)
  ```
- **testing-library: query by role/label, not `getByTestId`.** Role queries assert accessibility and survive markup churn. Use `userEvent` (async, real event sequence), not `fireEvent`.
  ```ts
  await userEvent.click(screen.getByRole('button', { name: /save/i }))
  ```
- **Type-level tests for generics/public types** — runtime tests don't cover the type contract. Use `expectTypeOf`/`assertType` or `// @ts-expect-error` to lock in that bad usage *fails to compile*.
  ```ts
  expectTypeOf(parse('1')).toEqualTypeOf<number>()
  // @ts-expect-error id must be string
  getUser(123)
  ```
- **Don't over-snapshot.** Whole-DOM/large-object `toMatchSnapshot()` rots and gets blindly `-u`'d. Use `toMatchInlineSnapshot` for tiny values or assert specific fields. Run with `--ci` so missing snapshots fail rather than silently write.
- **Tests must run under `strict` TS.** A loose test tsconfig hides null/any bugs the tests are meant to catch.

### Must-run

`vitest run --coverage` (or `jest --ci`) — never the bare watcher in CI; add `tsc --noEmit` (type errors + `@ts-expect-error`/`expectTypeOf` checks don't run otherwise), `eslint` with `no-floating-promises`/`no-misused-promises` (catches forgotten `await`), and a `--reporter` set so **unhandled rejections fail the run**.

## Go

Standard `testing` package + `go test ./...`. Idiomatic stack: table-driven tests with `t.Run` subtests, `github.com/google/go-cmp` for comparisons, `net/http/httptest` for HTTP. No third-party runner needed; assertion libs (testify) are optional and often discouraged in std-leaning codebases.

### Blind spots an agent must be told

- **Table-driven + `t.Run` subtests** give per-case names and let you run/filter one case.
  ```go
  for _, tc := range cases {
      t.Run(tc.name, func(t *testing.T) { /* ... */ })
  }
  ```
- **Capture the loop variable (pre-1.22).** Closures in parallel/deferred subtests over `tc` all see the last element unless you copy it. On Go ≥1.22 the loopvar is per-iteration, but write for the toolchain in `go.mod`.
  ```go
  tc := tc // needed before Go 1.22
  ```
- **`t.Parallel()` interacts with shared state and `t.Setenv`.** Parallel subtests run *after* the enclosing test returns; a `t.Setenv` or `t.Chdir` in the same test panics if parallel is set. Don't mix env mutation with parallel.
- **`t.Helper()` in every assertion helper**, or failures report the helper's line, not the caller's.
  ```go
  func assertEq(t *testing.T, got, want int) { t.Helper(); if got != want { t.Fatalf(...) } }
  ```
- **`cmp.Diff`, not `reflect.DeepEqual`.** `go-cmp` prints a readable diff, handles unexported fields via `cmpopts`, and floats via `cmpopts.EquateApprox`.
  ```go
  if diff := cmp.Diff(want, got); diff != "" { t.Errorf("mismatch (-want +got):\n%s", diff) }
  ```
- **Error checks: `errors.Is`/`errors.As`, never `err.Error()` string match** (breaks on `%w` wrapping).
  ```go
  if !errors.Is(err, os.ErrNotExist) { t.Fatalf("got %v", err) }
  ```
- **`t.Cleanup` over `defer` for fixtures.** It runs LIFO after the test *and its subtests*, composes across helpers, and survives `t.Parallel()` ordering where a top-level `defer` fires too early.
- **`t.TempDir()` and `t.Setenv`, not manual `os.MkdirTemp`/`os.Setenv`** — they auto-clean/auto-restore (and `t.Setenv` forbids parallel).
- **`testdata/` is special — the `go` tool ignores it.** Put fixtures there; reference with a relative path (cwd is the package dir during tests).
- **Golden files behind a `-update` flag.** Don't hand-encode expected blobs; compare to `testdata/x.golden` and regenerate with a flag.
  ```go
  var update = flag.Bool("update", false, "update golden files")
  if *update { os.WriteFile(golden, got, 0o644) }
  ```
- **Use `synctest` (1.24+ `testing/synctest`) for fake time**, or channels / `sync.WaitGroup` / `context` deadlines to synchronize.
- **`httptest.Server`/`httptest.NewRecorder`, not a real port or live network.** `Server` gives a real URL on a random port and auto-closes via `t.Cleanup`; `NewRecorder` tests a handler with no socket.
- **Fuzz targets are `FuzzXxx(f *testing.F)` with `f.Add` seeds + `f.Fuzz`.** They run as normal unit tests (seed corpus only) unless `-fuzz` is passed — cheap regression coverage for free.
  ```go
  func FuzzParse(f *testing.F) { f.Add("0"); f.Fuzz(func(t *testing.T, s string){ Parse(s) }) }
  ```
- **`t.Fatal` from a *spawned* goroutine doesn't stop the test and is a bug** — use `t.Error` + return there.
- **Don't assert on map iteration order or unsorted slices.** Sort first or use `cmpopts.SortSlices`; map ranging is randomized and will flake. The mirror image is a real *production* defect, not just a test smell: code that builds state by ranging a map (e.g. constructing a reverse lookup and keeping the first-seen value per key) inherits that randomized order, so its output is nondeterministic **across process runs** while looking stable within any one run. `-race` and single-process reruns are blind to it — probe it by injecting iteration order (feed the same source pairs in two orders and assert the result differs) or by repeating across separate `go test` invocations.

### Must-run

`go test -race ./...` (the data-race detector — agents almost never enable it and it catches bugs unit tests miss), plus `go vet ./...`. Use `go test -count=1` to defeat the test cache when checking flakiness, and `go test ./... -fuzz=FuzzXxx -fuzztime=30s` to exercise fuzz targets beyond the seed corpus.

## Rust

Idiomatic: built-in `#[test]` harness (no framework needed) + `assert_eq!`/`assert!`; `cargo test` runs unit, integration, **and** doc-tests. Common add-ons: `proptest`/`quickcheck` (property), `insta` (snapshots), `tokio`/`rstest` (async, parametrized), `cargo-nextest` (faster runner).

### Blind spots an agent must be told

- **Write doc-tests — agents almost never do.** Every public item's ` ```rust ` example in `///` is compiled and run by `cargo test`. Cheapest API-contract + "does the example still compile" test. Use `?` by returning `Result`, `no_run`/`ignore`/`should_panic` fences as needed, and hide setup with `# `.
  ```rust
  /// ```
  /// assert_eq!(mycrate::add(2, 2), 4);
  /// ```
  ```
- **Unit tests live in-module under `#[cfg(test)]`, not a separate file** — that's what reaches private items. The `#[cfg(test)]` is load-bearing; without it the module compiles into release builds.
  ```rust
  #[cfg(test)]
  mod tests {
      use super::*;
      #[test] fn parses() { assert_eq!(parse("1").unwrap(), 1); }
  }
  ```
- **Integration tests go in `tests/` and see ONLY the public API.** Each file is its own crate. Shared helpers must live in `tests/common/mod.rs` (the `/mod.rs` form), NOT `tests/common.rs`, or the helper file is itself run as a test.
- **`#[should_panic]` without `expected` passes on the WRONG panic.** Always pin a substring (it matches if the message *contains* it). Prefer testing `Result`/`Err` when the API returns them.
  ```rust
  #[should_panic(expected = "divide by zero")]
  ```
- **Assert on error *variant/identity*** with `matches!`, not the `Display` string.
  ```rust
  assert!(matches!(parse("x"), Err(Error::Invalid { .. })));
  ```
- **Async tests need a runtime — a bare `#[test] async fn` won't compile/run.** Use the executor's attribute; floating un-`.await`ed futures silently do nothing.
  ```rust
  #[tokio::test]
  async fn fetches() { assert_eq!(get().await, 200); }
  // multi-thread: #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
  ```
- **Tests run in parallel by default — shared global/env state races.** `std::env::set_var`, `set_current_dir`, and static mutation leak. Isolate, serialize with `#[serial]` (`serial_test`), or `cargo test -- --test-threads=1`.
- **Prefer property tests for invariants over a handful of literals.** `proptest` shrinks failing inputs to a minimal counterexample.
  ```rust
  proptest! {
      #[test]
      fn roundtrips(s in ".*") { prop_assert_eq!(decode(&encode(&s)), s); }
  }
  ```
- **Snapshot tests (`insta`) must be reviewed, not blindly accepted.** Use `cargo insta review`; CI should run `cargo insta test --unreferenced=reject` so stale `.snap` files fail.
- **`assert_eq!` takes a custom message as later args — use it for context in loops.**
  ```rust
  assert_eq!(got, want, "case {name}: input={input:?}");
  ```
- **Mark slow/networked tests `#[ignore]`, then run them explicitly** with `cargo test -- --ignored` (or `--include-ignored`).
- **Output is captured unless the test FAILS or you pass `--nocapture`.** Don't debug with `println!` and wonder where it went: `cargo test -- --nocapture`.

### Must-run

```sh
cargo test                       # runs unit + integration + DOC-tests (agents forget docs run here)
cargo test --doc                 # doc-tests only, when iterating on examples
cargo test -- --include-ignored  # the slow/network tests skipped by default
cargo test -- --test-threads=1   # confirm failures aren't parallel-state races
cargo test --all-features        # so feature-gated code is actually compiled and tested
cargo clippy --all-targets --all-features -- -D warnings   # lints test code too
cargo +nightly miri test         # catches UB the normal harness can't (unsafe code)
```

## Java / JVM

Framework: JUnit 5 (`org.junit.jupiter`) + AssertJ; mocks via Mockito. Run: `mvn test` / `./gradlew test` (use `verify` to also run Failsafe IT tests).

### Blind spots an agent must be told

- **Use AssertJ `assertThat`, not JUnit `assertEquals`.** Fluent chains give far better failure messages and read left-to-right (actual, then expectation).
  ```java
  assertThat(orders).hasSize(2).extracting(Order::status).containsExactly(PAID, PAID);
  ```
- **Assert on the thrown exception, don't just expect it.** `assertThrows` returns the exception — capture it and assert message/cause/type. There is no JUnit 4 `@Test(expected=...)` in JUnit 5.
  ```java
  var ex = assertThrows(IllegalArgumentException.class, () -> svc.parse("x"));
  assertThat(ex).hasMessageContaining("x");   // or assertThatThrownBy(...).isInstanceOf(...)
  ```
- **`@ParameterizedTest`, not a `for` loop over cases** — each case gets its own result and `@DisplayName`.
  ```java
  @ParameterizedTest @ValueSource(strings = {"", " ", "\t"})
  void rejectsBlank(String s) { assertThat(Validator.isValid(s)).isFalse(); }
  ```
- **Mockito strict stubs are on by default (`@ExtendWith(MockitoExtension.class)`).** Unused `when(...)` stubs FAIL as `UnnecessaryStubbing`. Stub only what the path uses, or use `lenient()` deliberately.
- **`@Mock`/`@InjectMocks` need the extension to be initialized.** Without `@ExtendWith(MockitoExtension.class)` (or `openMocks`), every `@Mock` field is null — a silent NPE.
- **`verify` interactions and counts, don't assume.** Use `verifyNoMoreInteractions` / `never()` to pin side effects.
  ```java
  verify(repo, times(1)).save(any());
  verify(mailer, never()).send(any());
  ```
- **`ArgumentCaptor` to inspect what was passed**, instead of loose `any()` that asserts nothing about the argument.
  ```java
  var cap = ArgumentCaptor.forClass(Order.class);
  verify(repo).save(cap.capture());
  assertThat(cap.getValue().total()).isEqualTo(42);
  ```
- **Awaitility for async** — poll for the condition with a timeout.
  ```java
  await().atMost(2, SECONDS).untilAsserted(() -> assertThat(queue.size()).isEqualTo(1));
  ```
- **`@TempDir` for filesystem tests** — auto-created and auto-cleaned; don't hand-roll `File.createTempFile`.
- **Testcontainers for real infra (DB, Kafka, Redis), not embedded fakes or H2-pretending-to-be-Postgres** — embedded substitutes hide dialect/locking bugs. Mark `@Testcontainers` + `@Container`.
- **Don't test trivial getters/setters/`equals` of plain data classes** — it pads coverage and tests the compiler.
- **`@Nested` + `@DisplayName` to group cases** and give human-readable report names.
- **Floats with `offset`, and `isEqualByComparingTo` for `BigDecimal`** (scale-sensitive `equals`).
  ```java
  assertThat(price).isEqualByComparingTo("19.99");   // 19.99 vs 19.990 differ via equals()
  ```
- **Kotlin: use MockK + kotest/JUnit5, not Mockito** (Mockito chokes on final-by-default classes). Mock coroutines with `coEvery`/`coVerify`.
  ```kotlin
  coEvery { repo.load(1) } returns user
  ```
- **Kotlin coroutines: use `runTest` and a test dispatcher**, never `runBlocking` with real delays — virtual time auto-advances `delay()`.
  ```kotlin
  @Test fun loads() = runTest { assertThat(vm.load()).isEqualTo(user) }
  ```

### Must-run

- `mvn verify` (or `./gradlew check`) — `test` alone skips Failsafe `*IT` integration tests and many static checks.
- Run with the **JUnit 5 Platform on the path** (surefire ≥ 2.22 / a recent Gradle); a stale runner silently runs *zero* tests and still reports green.
- Keep **Mockito strict stubs** on — don't downgrade to `Strictness.LENIENT` globally to "fix" failures.
- For concurrency-sensitive code, prefer deterministic Awaitility conditions over `-Dsurefire.rerunFailingTestsCount` (which masks, not fixes).

## C# / .NET

Framework: **xUnit** (`[Fact]`/`[Theory]`) + **FluentAssertions** for asserts + **NSubstitute** or **Moq** for fakes. Run: `dotnet test` (add `--logger "console;verbosity=detailed"` for per-test output).

### Blind spots an agent must be told

- **Async tests return `Task`, never `async void`.** An `async void` test runs *unawaited* — exceptions escape the runner and it reports green. xUnit throws on `async void`, but agents still write them.
  ```csharp
  [Fact] public async Task Saves() => await _sut.SaveAsync();   // not: async void Saves()
  ```
- **`[Theory]` + `[InlineData]` instead of a `foreach` loop** — one result per row, so you see *which* input failed. Use `[MemberData]`/`[ClassData]` for non-constant cases.
  ```csharp
  [Theory] [InlineData(-1)] [InlineData(0)]
  public void Rejects_nonpositive(int n) => act.Should().Throw<ArgumentException>();
  ```
- **One assertion library, consistently.** With FluentAssertions, argument order is `actual.Should().Be(expected)` — the reverse of `Assert.Equal(expected, actual)`; getting it backwards yields misleading messages.
- **Assert on thrown exceptions; capture the delegate, assert type *and* the part of the message/param that matters.**
  ```csharp
  Action act = () => _sut.Withdraw(-5);
  act.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("amount");
  await act.Should().ThrowAsync<...>();   // async overload for awaitables
  ```
- **Verify mock calls precisely, including "never".**
  ```csharp
  _repo.Received(1).Save(Arg.Is<Order>(o => o.Id == 7));   // NSubstitute
  _repo.DidNotReceive().Delete(Arg.Any<int>());
  _mock.Verify(r => r.Save(It.Is<Order>(o => o.Id == 7)), Times.Once);  // Moq
  ```
- **Pass and assert `CancellationToken`** — code under test takes a token; verify cancellation is honored, not ignored.
  ```csharp
  using var cts = new CancellationTokenSource();
  cts.Cancel();
  await act.Should().ThrowAsync<OperationCanceledException>();
  ```
- **Constructor = setup, `IDisposable.Dispose` = teardown.** xUnit makes a *new class instance per test* (no shared mutable state by default) — lean on that instead of `[SetUp]`-style fields. Don't reuse one instance across tests.
- **Share expensive state with fixtures, not statics.** `IClassFixture<T>` shares across a class; `ICollectionFixture<T>` + `[Collection]` across classes. Tests in a collection run *serially*; everything else may run in parallel.
- **`[Collection]` to opt out of parallelism when needed** — two classes touching the same DB/env var will interleave and flake.
- **Nullable-aware tests.** With `<Nullable>enable</Nullable>`, don't sprinkle `!` to silence warnings — assert non-null first so the failure is a clear assertion, not a `NullReferenceException`.
  ```csharp
  result.Should().NotBeNull();
  result!.Name.Should().Be("a");
  ```
- **Integration tests use `WebApplicationFactory<TEntryPoint>`, not a real Kestrel port.** It hosts the app in-memory with an `HttpClient`; override deps via `WithWebHostBuilder(b => b.ConfigureTestServices(...))`. Don't hard-code `localhost:5000`.
- **`InternalsVisibleTo` over reflection** to test internals.
- **Don't assert on culture-sensitive formatting.** `ToString()` on dates/decimals varies by machine culture; assert structured values or pin `CultureInfo.InvariantCulture`.

### Must-run

```
dotnet test /p:CollectCoverage=true        # coverage (coverlet); agents skip it
dotnet test -- RunConfiguration.TreatNoTestsAsError=true   # catch zero-discovered-tests
dotnet build -warnaserror                  # nullable + analyzer warnings fail the build
dotnet format --verify-no-changes          # style/whitespace gate
```
Run the full suite once with parallelism on (the default) before declaring done — shared-state bugs only appear when tests run concurrently.

## Ruby

**Framework:** RSpec (idiomatic default) or Minitest (Rails/stdlib default). Run: `bundle exec rspec` / `bundle exec rspec spec/path_spec.rb:42` for one example; Minitest: `bundle exec rake test` or `ruby -Itest test/foo_test.rb`.

### Blind spots an agent must be told

- **`let` and `subject` are LAZY + memoized per-example.** The block runs on first reference, then caches for that example only. An agent expecting `let` to "set up" eagerly is surprised when a record is never created because nothing referenced it. Use `let!` (runs in a `before`) only when the side effect, not the value, is the point.
  ```ruby
  let(:user) { create(:user) }      # NOT created until referenced
  let!(:flag) { create(:flag) }     # created before every example
  ```
- **`subject` is the implicit thing under test — name it, don't stub it.** Never stub/mock the object you're asserting on; stub collaborators, not the SUT.
  ```ruby
  subject(:result) { calculator.total }   # assert on result; stub deps, not calculator
  ```
- **factory_bot over fixtures, and pick the cheapest strategy.** `build` (no DB), `build_stubbed` (no DB, fake id + stubbed associations — fastest), `create` (hits DB). Agents default to `create` everywhere and make suites slow. Use traits and transient attrs over bespoke setup.
  ```ruby
  user = build_stubbed(:user, :admin)      # no DB round-trip
  order = create(:order, :paid, items: 3)  # only when persistence matters
  ```
- **Assert state CHANGE with `change`, not before/after snapshots.** Pair with `by`/`from`/`to`.
  ```ruby
  expect { post :create, params: p }.to change(User, :count).by(1)
  expect { obj.archive! }.to change(obj, :status).from("open").to("closed")
  ```
- **`aggregate_failures` to see all failures in one run** — without it the first failed expectation aborts the example and hides the rest.
  ```ruby
  aggregate_failures do
    expect(res.status).to eq(200)
    expect(res.body).to include("ok")
  end
  ```
- **Predicate matchers: `be_present`, `be_empty`, `have_key` are auto-derived.** `be_foo` calls `foo?`; `have_foo` calls `has_foo?`. Don't write `expect(x.empty?).to eq(true)`.
  ```ruby
  expect(list).to be_empty          # calls list.empty?
  expect(hash).to have_key(:id)     # calls hash.has_key?(:id)
  ```
- **`verify_partial_doubles` must be on, or typo'd stubs pass silently.** On in the default `spec_helper`, but agents writing standalone configs forget it. Use `instance_double`/`instance_spy` (verified) over bare `double`.
  ```ruby
  mock_config.verify_partial_doubles = true
  client = instance_double(ApiClient, fetch: payload)   # verifies fetch exists
  ```
- **Freeze/travel time** with ActiveSupport `travel_to`/`freeze_time` (Rails) or Timecop; block form auto-restores.
  ```ruby
  travel_to(Time.zone.local(2026, 1, 1)) { expect(invoice.due_on).to eq(...) }
  ```
- **DRY contract suites with `shared_examples` / `it_behaves_like`, not copy-paste** (polymorphic types sharing a contract).
  ```ruby
  it_behaves_like "a serializable", described_class.new
  ```
- **`raise_error(Klass, /regex/)` two-arg form** — a bare `raise_error` (no args) passes on ANY error, including the wrong one.
  ```ruby
  expect { parse(x) }.to raise_error(ParseError, /unexpected token/)
  ```
- **Stub external HTTP — don't hit the network.** Use WebMock/VCR; disable real connections globally in test setup.
  ```ruby
  stub_request(:get, /api\.x\.com/).to_return(body: '{"ok":true}')
  ```
- **Minitest note:** assertion arg order is `assert_equal(expected, actual)` (reversed vs many frameworks). Use `assert_raises(Err) { ... }` and `setup`/`teardown` for fixtures.

### Must-run

`bundle exec rspec --seed $RANDOM` (default random order catches order-dependent leaks; reproduce a failure with the printed seed); `bundle exec rubocop` with **rubocop-rspec** (flags `let!` overuse, multiple-expectation examples, missing `described_class`, focused `:focus`/`fit` left in); ensure `--require spec_helper` loads `verify_partial_doubles`; for Rails, `use_transactional_fixtures`/DatabaseCleaner to confirm DB isolation.

## C / C++

Frameworks: GoogleTest (+ GoogleMock), Catch2, or doctest. Build & run via CMake/CTest: `cmake -B build && cmake --build build && ctest --test-dir build --output-on-failure`.

### Blind spots an agent must be told

- **Sanitizers are not optional — a "passing" test under no sanitizer proves little.** Memory bugs and UB are *the* failure mode in C/C++; a clean run without ASan/UBSan routinely hides heap-overflows, use-after-free, and signed-overflow UB. Build a dedicated sanitizer config and run the whole suite under it.
  ```cmake
  add_compile_options(-fsanitize=address,undefined -fno-sanitize-recover=all -g)
  add_link_options(-fsanitize=address,undefined)
  ```
  Run with `ASAN_OPTIONS=abort_on_error=1 UBSAN_OPTIONS=halt_on_error=1 ctest`.
- **Concurrency tests need TSan, in a *separate* build.** ASan and TSan can't coexist; a data race never surfaces under ASan. Any test touching threads/atomics/mutexes must also run under `-fsanitize=thread`.
  ```bash
  cmake -B build-tsan -DCMAKE_CXX_FLAGS="-fsanitize=thread -g" && ctest --test-dir build-tsan
  ```
- **Register the test with CTest, don't just compile it.** Agents add a `gtest_main` target and stop, so `ctest` reports "No tests found." Use `gtest_discover_tests` (runs the binary to enumerate cases) rather than hand-listing.
  ```cmake
  include(GoogleTest)
  gtest_discover_tests(my_tests)
  ```
- **Death tests for crashes/assert/abort — and they have rules.** Use `EXPECT_DEATH`, not "run it and see." Name the fixture `*DeathTest` (GTest runs those first/single-threaded) and match on a regex of stderr, not exact text.
  ```cpp
  EXPECT_DEATH(Pop(empty_stack), "stack is empty");
  ```
- **`ASSERT_*` vs `EXPECT_*`: `ASSERT_*` only returns from the current function.** In a helper it does NOT abort the test — execution continues in the caller on freed/invalid state. Use `EXPECT_*` to keep going, `ASSERT_*` to guard a precondition, and check `HasFatalFailure()` after a void helper.
- **A test that leaks still "passes" — wire up a leak check.** GoogleTest won't fail on a leaked `new`. Run under ASan (LeakSanitizer on by default on Linux) or `valgrind --leak-check=full --error-exitcode=1`.
- **Parametrize / type-parametrize instead of copy-pasting cases**, so each case reports independently.
  ```cpp
  INSTANTIATE_TEST_SUITE_P(Edges, AbsTest, testing::Values(-1, 0, INT_MIN));
  TYPED_TEST_SUITE(ContainerTest, testing::Types<std::vector<int>, std::deque<int>>);
  ```
- **gMock is for interfaces (virtual methods) — and unmet/leaked expectations must verify.** Don't mock a concrete value type; mock behind an abstract base. Expectations are checked when the mock is destroyed, so a mock that outlives the test silently never verifies. Prefer `StrictMock`.
  ```cpp
  StrictMock<MockClock> clock;
  EXPECT_CALL(clock, Now()).WillOnce(Return(t0));
  ```
- **Float comparisons: never `EXPECT_EQ` on doubles.** Use `EXPECT_DOUBLE_EQ` / `EXPECT_NEAR(a, b, eps)`; raw `==` flakes on rounding and fails on NaN semantics.
- **`TEST` vs `TEST_F` matters.** `TEST_F` recreates the fixture per test (`SetUp`/`TearDown` each time); state does NOT carry between tests, so don't rely on ordering. Shared mutable globals across two tests in a suite is a bug.
- **Fuzz the parsers/decoders, don't just unit-test happy paths.** Untrusted-input code wants a libFuzzer/AFL harness.
  ```cpp
  extern "C" int LLVMFuzzerTestOneInput(const uint8_t* d, size_t n) {
    parse(std::string_view(reinterpret_cast<const char*>(d), n)); return 0; }
  ```
- **Compile tests with `-Wall -Wextra -Werror`** to catch sign-compare and unused-result bugs the test itself introduces.

### Must-run

`ctest --output-on-failure` under an **ASan+UBSan** build (`-fsanitize=address,undefined -fno-sanitize-recover=all`); a **separate TSan** build for any threaded code (`-fsanitize=thread`); a **leak check** (LSan or `valgrind --error-exitcode=1`); and compile with **`-Wall -Wextra -Werror`**. Run fuzz harnesses for input-parsing code.

## Must-run cheat-sheet

The command(s) an agent forgets, per language:

| Language | What agents forget to run |
|---|---|
| **Python** | `pytest -W error` (warnings-as-errors); `mypy .` / `pyright` (type-check); keep `pytest-randomly` ON; Hypothesis property seed |
| **TypeScript / JS** | `tsc --noEmit` (type-check + `expectTypeOf`/`@ts-expect-error`); `vitest run`/`jest --ci` (never the watcher); eslint `no-floating-promises`; reporter that fails on unhandled rejections |
| **Go** | `go test -race ./...` (race detector); `go vet ./...`; `go test -count=1` (defeat cache); `go test -fuzz=FuzzXxx -fuzztime=30s` |
| **Rust** | `cargo test --doc` (doc-tests); `cargo test --all-features`; `cargo test -- --include-ignored`; `cargo clippy -- -D warnings`; `cargo +nightly miri test` (UB) |
| **Java / JVM** | `mvn verify` / `gradle check` (runs Failsafe `*IT` + static checks, not just `test`); confirm JUnit 5 Platform actually ran tests; keep Mockito strict stubs |
| **C# / .NET** | `dotnet build -warnaserror` (nullable/analyzers); `dotnet test /p:CollectCoverage=true`; `TreatNoTestsAsError=true`; run with default parallelism |
| **Ruby** | `rspec --seed $RANDOM` (order leakage); `rubocop` + rubocop-rspec; `verify_partial_doubles` on; WebMock/VCR network block |
| **C / C++** | `ctest` under **ASan+UBSan**; **separate TSan** build for threads; leak check (LSan / valgrind `--error-exitcode=1`); `-Wall -Wextra -Werror`; fuzz parsers |
