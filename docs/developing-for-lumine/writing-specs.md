# Writing specs

Lumine and its packages are tested with **specs** — Jasmine-based tests that run inside a real editor window, so they can exercise the actual editor API.

## Where specs live

Put specs in your package's `spec/` directory, named `*-spec.js` (or `*-spec.jsx` for a spec that itself contains JSX). A spec uses the familiar Jasmine structure and has the full `lumine` API available:

```js
describe("my-package", () => {
  it("greets", async () => {
    await lumine.packages.activatePackage("my-package");
    lumine.commands.dispatch(
      lumine.views.getView(lumine.workspace),
      "my-package:hello",
    );
    expect(lumine.notifications.getNotifications().length).toBe(1);
  });
});
```

## Waiting

A spec body that takes no argument is awaited, so `async () => {}` is all most specs need. When you have to wait for something that is not a promise you hold, the runner puts five waiters on the global — no import:

| Waiter                                              | Use it for                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| `flushMicrotasks(count)`                            | a promise chain with no timer in it. Cheapest, and it cannot hang.      |
| `waitForFrames(condition, { frames })`              | something that needs a paint: a rendered view, a measurement, a scroll. |
| `conditionPromise(condition, description, timeout)` | real I/O — a subprocess, a file watcher, a network round trip.          |
| `emitterEventPromise(emitter, event, timeout)`       | the next event from a Node-style emitter, with a real-clock timeout.    |
| `timeoutPromise(ms)`                                | a fixed pause on the real clock.                                        |

The catch is that **the runner freezes time**: `setTimeout`, `setInterval` and `Date.now` are all faked, so `await new Promise((resolve) => setTimeout(resolve, 10))` never resolves. Advance the fake clock with `advanceClock(ms)` when the code under test schedules its own timer, or call `jasmine.useRealClock()` as the first line of a `beforeEach` when it genuinely needs wall time. The waiters above already reach past the fake clock.

Never combine `async` with Jasmine's `done` argument. A spec body that declares any parameter is handed `done` and is _not_ awaited, so a rejection inside it hangs the spec instead of failing it.

## Running specs

- **From the editor** — open your package and run `window:run-package-specs` to run its `spec/` suite in a dedicated window.
- **From the command line** — run a suite headlessly by pointing the `lumine` command at it:

  ```sh
  lumine --test spec/my-feature-spec.js
  lumine --test spec           # run the whole directory
  ```

  Every `lumine-code` package repository exposes the second form as `npm test`, so a fresh clone needs no further setup. The run exits with the suite's status code, and it loads the editor from the source checkout named by `LUMINE_RESOURCE_PATH` — see [Launching Lumine](../getting-started/launching-lumine.md) — or from the installed build when that variable is unset.

## Tips

- Activate the package under test explicitly with `lumine.packages.activatePackage` rather than assuming it is loaded.
- Dispatch commands through `lumine.commands.dispatch` against the right view to test behavior the way a user triggers it.
- Keep specs isolated — undo any config or workspace changes, since specs share one editor environment.

## Display performance benchmarks

The editor repository provides `npm run benchmark:display` for display mapping, decoration queries, long-line edits and scrolling. Freeze the baseline before changing production code; the runner copies the source and the exact installed Superstring addon into the output directory. Use the same directory for the subsequent comparison:

```sh
npm run benchmark:display -- --phase baseline --profile quick --output ../.dev/benchmarks/display-legacy/my-run
npm run benchmark:display -- --compare --profile release --output ../.dev/benchmarks/display-legacy/my-run
```

The release comparison alternates baseline and candidate in three A–B–B–A blocks, giving six fresh processes per variant, five warmups and thirty measured samples per case. Run it on the same machine with fixed editor dimensions and font settings, after builds and other test processes finish. Raw samples, runtime and addon metadata, semantic checksums, medians, p95 and bootstrap confidence intervals remain in the output directory; generated reports are not committed.

Measure the complete operation rather than the native lookup alone: packed mapping still pays for JavaScript clipping and result allocation, and cached markers can be cheaper than a batch. Geometry reuse applies to short ASCII identifier replacements that preserve layout; parser highlighting events may invalidate a larger range afterwards. The component-update measurements report synchronous CPU and DOM work, not the time a frame is presented on screen.

### Recorded legacy display comparison

The September 30, 2026 comparison used Windows x64, Electron 44.5.0 and Node 24.21.0. A full 278-case release comparison covered six fresh processes per variant and 180 measured samples per case. A subsequent cached-decoration allocation cleanup received a separate 22-case comparison with the same process and sample counts; the original full results and intermediate control confirmations were retained. All comparisons matched their output checksums.

| Operation | Legacy median | Candidate median | Improvement |
| --- | ---: | ---: | ---: |
| Uncached decoration query, 256 endpoints with wrap | 1.3 ms | 0.7 ms | 46% |
| Uncached decoration query, 5000 endpoints with wrap | 33.0 ms | 14.5 ms | 56% |
| Uncached decoration query, 5000 endpoints with folds | 42.6 ms | 15.5 ms | 64% |
| Replacement to component update, 250k-character plain-text line | 3.5 ms | 1.0 ms | 71% |
| Replacement to component update, 1M-character plain-text line | 8.2 ms | 1.9 ms | 77% |

The decoration rows come from the final focused comparison; the replacement rows come from the full comparison, whose geometry implementation and native addon remained unchanged by the later collector cleanup. The final 22 cases had no median or p95 regression exceeding both 5% and 0.5 ms. The broad comparison initially had uncertain control regressions, which prompted isolated confirmations and a cleanup that avoids allocating unused batch structures for cached-only decorations.

These measurements apply to Superstring commit `57a49a92f51b088642a130d03bed70598906887d` and editor commit `87a2c435304f8064bdf6c94523952fa814fc45ae`. They are examples of the tested workloads, not an estimate of whole-editor speedup. Local artifacts are under `.dev/benchmarks/display-legacy/2026-09-30-targeted` and `.dev/benchmarks/display-legacy/2026-09-30-final-cached-cleanup`.

## Injection routing benchmarks

The focused `npm run benchmark:injection-routing` benchmark separates buffer-change routing, synchronous editing and the complete edit-to-syntax-settled interval. It uses 500 and 5000 independent WASM injections, with edits before, inside and after them, plus a length-changing control. Freeze the source before changing it, then compare against that snapshot:

```sh
npm run benchmark:display -- --freeze --output ../.dev/benchmarks/injection-routing/before
npm run benchmark:injection-routing -- --compare --profile release --baseline ../.dev/benchmarks/injection-routing/before/baseline/lumine --output ../.dev/benchmarks/injection-routing/comparison
```

The release comparison uses three A–B–B–A blocks, six fresh processes per variant, five warmups and thirty measured edits per case. Parser, tree-edit and injection discovery/reconciliation counters come from a separate diagnostic pass, not the timing loop. Semantic SHA256 checks cover the complete trees, included ranges and highlight boundaries after the final measured edit and diagnostic edit; they do not replace the functional suite. Runtime versions, loaded module/addon hashes and grammar/query hashes accompany the raw samples. `--electron <executable>` selects a separately provisioned runtime, and `--power-profile <description>` records the measured environment.

An equal-extent edit strictly before an injection can skip its tree edit only when both its owner and all known content ranges follow the edit. Boundary touches, coordinate shifts and unknown ranges keep the full update path. The root still parses and reconciles injection topology. This is a small legacy optimization, not a replacement parser or worker system.

### Recorded injection routing comparison

The September 30, 2026 final comparison used Electron 44.5.1 on Windows x64, with six fresh processes per variant and 180 measured edits per case. The baseline was editor commit `99d1dee32dffb251adf969cbea4fe77c362408d0`; the candidate was `335e8d733b2c69054c4c1d3682b65ac8178eca26`, including the fold-cache compatibility correction. Both sources were frozen separately from concurrent workspace edits. All eight cases matched their complete-tree/range/highlight checksums. Another Electron validation process was active on the machine, so these are paired results under that recorded background load, not a quiet-machine absolute latency gate.

| Case | Routing before | Routing after | Complete edit before | Complete edit after |
| --- | ---: | ---: | ---: | ---: |
| 500 injections, equal-extent replacement before them | 1.96 ms | 0.77 ms | 6.07 ms | 4.87 ms |
| 5000 injections, equal-extent replacement before them | 30.12 ms | 11.23 ms | 89.27 ms | 66.04 ms |
| 5000 injections, replacement inside the first one | 30.00 ms | 11.60 ms | 93.03 ms | 71.06 ms |

Leading replacements reduced child `handleTextChange`/`tree.edit` calls from 500 or 5000 to zero. An internal replacement routed to one child instead of all following children; both backends still parsed that one child. Neither backend parsed unchanged children for the leading edit, so this is routing/tree-edit savings, not newly introduced parser reuse. Fold predicates can inspect text outside a child's included ranges, so the shortcut still resets its fold cache; a same-row prefix regression is tested with both WASM and native runtimes. The 5000-layer leading routing ratio's bootstrap 95% interval was approximately 0.33–0.43; the complete edit improved by about 26%, not 63%. Ordinary insertion and deletion shift later coordinates and do not qualify for this shortcut.

The final trailing and length-changing controls showed no median/p95 regression exceeding both 5% and 0.5 ms in any measured phase. The earlier candidate's broad run had one routing p95 increase from 9.06 to 9.94 ms while its complete-operation p95 improved. Its separate six-process-per-variant trailing-only confirmation gave routing median 7.05 → 6.95 ms and p95 9.77 → 7.82 ms, consistent with an unchanged path and timing variability. These observations are retained, not substituted into the final results. Raw final results are under `.dev/benchmarks/injection-routing/2026-09-30/final-fold-cache`; the earlier `release`, `trailing-control` and short `orientation` runs remain alongside them. Absolute timings differ between these separate series, which is another reason to compare each paired baseline/candidate rather than mixing runs.

## Marker edit profiling

The injection runner also supports `--suites injections,markers,representative`. The general-marker suite covers 1000 and 10000 markers with no, sparse and dense change listeners; the representative suite uses real HTML, Vue and IPython injection providers. Insert/delete controls accompany equal-extent replacements. Grammar assets and provider/helper source hashes must agree across the comparison. Private provider instances and temporary registrations are disposed without unloading a live package generation.

```sh
npm run benchmark:injection-routing -- --compare --profile release --suites injections,markers,representative --baseline ../.dev/benchmarks/marker-splice/before/baseline/lumine --output ../.dev/benchmarks/marker-splice/comparison
```

The separate diagnostic pass counts and measures native text mutation, marker-index splices, JavaScript layer splices, marker range reads, transaction events, parser entry and injection discovery/reconciliation. Nested instrumented spans have inclusive and exclusive durations; async parse wall time is not CPU time. Instrumentation changes the workload, so these spans identify profiling candidates rather than replacing the uninstrumented edit latency. Native methods are shadowed only on actual buffer/index instances, not on a second loaded addon or a non-configurable prototype.

The September 30, 2026 experiment tried a small native shortcut for equal-extent edits strictly outside a singleton marker index. It added no API or cache fields, but its six-process-per-variant comparison did not demonstrate a worthwhile complete-edit improvement: all complete-edit bootstrap intervals included a ratio of one. For 5000 injections, leading edits were 50.50 → 51.85 ms and trailing edits 49.98 → 49.68 ms. The experiment was removed from production; its boundary, enclosing-range, exclusive-marker, maximum-coordinate and randomized regression tests remain. Artifacts are retained under `.dev/benchmarks/marker-splice/2026-09-30/native-only-release`, not substituted with the short exploratory run.

An instrumented 5000-layer diagnostic observed approximately 5000 native splices and 10000 marker range reads, with about 18 ms and 14 ms of inclusive method time respectively. These include wrapper/conversion and instrumentation overhead, not just C++ tree work. Layer event emission was much smaller in that probe. This points toward measuring boundary/allocation costs before changing the index algorithm or adding a subsystem. It does not yet justify a particular batch API.

The profiling work also reproduced independent correctness issues. Fold predicates can read a suffix outside their injection, and cached `isFoldableAtRow` results can depend on a different row: skipped syntax edits now invalidate the relevant fold context and clear the boolean cache once when row contexts overlap or ranges are unknown. Known different-row contexts keep that cache. Streamed native regex matches across a split CRLF now use logical coordinates and advance correctly after a pending CR; native CLI failures on Windows stay in stderr/nonzero exit status instead of opening a runtime dialog. These are correctness changes, not claimed performance gains.

## Captured-frame diagnostics

`npm run benchmark:presentation` drives a real visible, focused editor window through main-process `sendInputEvent`. It covers typing, benchmark-payload paste, undo and scrolling, plus HTML, Vue and IPython injections. A rendered pixel marker identifies the input revision after the editor DOM acknowledges the expected change, rejecting unrelated cursor frames and stale captures. The default run collects one hundred interactions per case and keeps failures, warmups and raw samples in its output directory.

```sh
npm run benchmark:presentation -- --samples 100 --output ../.dev/benchmarks/editor-presentation/my-run
```

Treat its latency as input-to-subscription-observed captured frame, not physical monitor scanout or the earliest presented frame. Electron 44.5.1 limits `beginFrameSubscription` to thirty captures per second and returns dirty crops in physical pixels; see the [Electron implementation](https://github.com/electron/electron/blob/v44.5.1/shell/browser/api/frame_subscriber.cc). Capture cadence cannot establish a 16.7 ms or 8.33 ms frame deadline or count missed monitor frames. A precise presentation gate requires a separate presentation-feedback/trace measurement.

The report separates captured-frame latency from instrumented component/editor method durations collected until settling; those method durations are not total renderer CPU, may overlap and exclude asynchronous parser work outside the wrappers. Syntax settles between samples, but the first captured frame does not prove syntax-correct paint. Paste uses an editor-scoped in-memory payload after native command dispatch, leaving the user's clipboard untouched and excluding clipboard transfer/providers. Smooth-scroll animation drains between samples, and the no-op control must not acknowledge or capture a changed revision. Font, viewport, DPI, packages, grammar assets and loaded addons are recorded. Do not run builds or other benchmarks concurrently, and do not reuse an output directory.

The first diagnostic series collected 1400 measured actions and 100 no-op controls on a 120 Hz Windows monitor, with zero failed interactions and zero observed long tasks. Plain-text typing had an input-to-capture median/p95 of 17.88/18.98 ms; the fixed 720-character paste into a reset 2000-line fixture had 101.58/114.67 ms. The paste's DOM acknowledgement reached the main process after a median of 13.09 ms, with another 88.27 ms to the accepted capture; those independently summarized phases must not be mistaken for physical presentation latency. This illustrates why captured-frame timing cannot substitute for editor CPU or a monitor-frame deadline. Raw results remain under `.dev/benchmarks/editor-presentation/2026-09-30-current-capture-100-primary`. That series used the original renderer method timer; later high-resolution method timing, summary metadata and orderly teardown received a separate smoke run, not a second 1400-action run.
