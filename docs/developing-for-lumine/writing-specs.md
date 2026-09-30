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
