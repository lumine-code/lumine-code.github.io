# Jupyter services and lifecycle

The Jupyter family uses one runtime and nine independently activated packages. Packages own their views, documents, or data models; they communicate through public services and never obtain a transport or internal kernel object.

## Package responsibilities

| Package | Responsibility |
| --- | --- |
| `jupyter-repl` | Kernel discovery, connections, sessions, execution, shared output rendering, and kernel input. |
| `jupyter-cells` | Source-file cell boundaries, navigation, execution targets, and notebook conversion. |
| `jupyter-view` | Notebook documents, stable cell identities, split views, editing, and notebook execution adapters. |
| `jupyter-inspector` | Documentation and introspection for the selected expression. |
| `jupyter-variables` | Python namespace snapshots, filtering, editing, and cached namespace access. |
| `jupyter-explorer` | Python data sessions, paged grids, filtering, search, profiles, and bounded chart samples. |
| `jupyter-watches` | Watched expressions, execution policy, retained run history, and cached watch access. |
| `jupyter-prompt` | A command prompt and retained history, executing code through the shared execution service. |
| `jupyter-monitor` | A kernel registry view and session controls through the public kernel service. |

Each package registers its commands and service edges during synchronous activation and creates expensive views lazily. The prompt and monitor can be activated, unloaded, and restored independently of the runtime. Notebook documents and source-file cell indexes remain independent, as do namespace discovery, documentation inspection, data exploration, and watch evaluation.

## Service boundaries

| Service | What crosses the boundary |
| --- | --- |
| [`jupyter.kernel`](https://github.com/lumine-code/jupyter-repl/blob/master/docs/jupyter.kernel.md) | The session registry, session identity and generation, owned requests, status observations, and kernel control. |
| [`jupyter.context`](https://github.com/lumine-code/jupyter-repl/blob/master/docs/jupyter.context.md) | The command's focused editor, expression, and source cell range. |
| [`jupyter.execution`](https://github.com/lumine-code/jupyter-repl/blob/master/docs/jupyter.execution.md) | Captured source-editor or notebook targets, or editorless code with an explicit session and generation. |
| [`jupyter.output`](https://github.com/lumine-code/jupyter-repl/blob/master/docs/jupyter.output.md) | Canonical output-event reduction, MIME rendering, and output actions. |
| [`jupyter.cells`](https://github.com/lumine-code/jupyter-cells/blob/master/docs/jupyter.cells.md) | Source-file cell discovery and source ranges. |
| [`jupyter.adapter`](https://github.com/lumine-code/jupyter-repl/blob/master/docs/jupyter.adapter.md) | Notebook ownership, stable targets, source snapshots, and output delivery. |
| [`jupyter.notebook`](https://github.com/lumine-code/jupyter-view/blob/master/docs/jupyter.notebook.md) | Notebook-specific document operations. |
| [`jupyter.explorer`](https://github.com/lumine-code/jupyter-explorer/blob/master/docs/jupyter.explorer.md) | An explicit session and expression or data file to display. |

Resolve the command editor once from its dispatch event. Ask `getKernelForEditor(editor)` or `getKernelForItem(item)` for that surface's session rather than substituting the active document's kernel. Notebook fragments belong to their notebook adapter; expression fields in inspection panels belong to the panel's `getJupyterKernel()` session. `onDidChangeJupyterKernel(callback)` observes changes to that pane-owned session. Mini editors are excluded from source-command context.

The prompt captures its selected session, generation, and code before awaiting execution service availability. It sends an editorless execution intent and awaits the same receipt used by source and notebook runs. The monitor renders registry metadata and invokes public session controls; it owns neither the registry nor a transport. Removing either consumer leaves the runtime and other packages available.

## Owned requests

A session has an opaque ID and a public generation. Its ID remains stable for the live session, while connection or process replacement advances its generation. A retired ID is never reassigned to a new runtime session. Capture both the owner and generation before awaiting work.

`session.request({type, purpose, code, cursorPos, timeoutMs, signal})` returns an owned handle with `id`, `generation`, `done`, `onDidOutput(callback)`, and `dispose()`. Use `type: "execute"`, `"inspect"`, or `"complete"`. The required `purpose` is `"user"` for user execution or `"query"` for internal inspection and refresh work; it controls history, counters, and refresh feedback, and does not claim that executing an expression is free of side effects.

`onDidOutput` delivers notebook output events while the request runs. `done` settles exactly once with `status`, `outputs`, `executionCount`, and optional `error` or introspection `data`. Execution waits for both the shell reply and the trailing IOPub idle, in either channel order. Consumers do not reconstruct terminal protocol state from output messages.

| Outcome | Consumer behavior |
| --- | --- |
| `ok` | Apply the result only while the captured owner and session generation remain current. |
| `error` | Present the kernel or send error. |
| `timeout` | End the wait and report the timeout. |
| `cancelled` | Drop the cancelled observation. |
| `unavailable` | Release pending UI state and wait for a usable session. |
| `unknown` | Report that accepted code may have run; do not retry a side effect automatically. |

Dispose a request when its view, model, or service edge retires. An AbortSignal cancels the same observation. Cancellation removes queued work when it can be proved unsent and stops observing already sent work; it never interrupts the shared kernel. Interrupt, restart, and shutdown are separate user actions. Temporary kernel resources require explicit cleanup in the original generation, ordered after any accepted creation request.

Refresh policy belongs to each feature. Variables coalesces concurrent invalidations into one trailing namespace scan and pauses automatic scans while the panel is closed. Watches runs one evaluation per expression at a time. Inspector supersedes older inspections. Explorer cancels obsolete queries and releases its previous paged data session.

## Service and view lifetime

Service consumption is passive and each consumed callback returns a Disposable for exactly that provider edge. Providers may disappear and return while consumers stay active. A disposer for an older edge must not clear a replacement, even when both edges received the same service object; use an edge token rather than comparing the service object alone.

Each notebook target execution also owns a Disposable job lease returned by `beginTargetExecution`. Disposing that lease retires exactly its counters and timer, even when the adapter provider has disappeared while the document remains alive. Normal completion retires the same job before cleanup; parallel or replacement jobs retain their own state.

Keep kernel and document data separate from DOM and renderer generations. Watch definitions and normalized run history belong to their models; expression editors belong to the mounted watch views. Removing or replacing `jupyter.output` changes rendering without discarding those models. Use owned pure `createOutputAccumulator()` artifacts to append events incrementally while preserving stream cursors, deferred clears and display updates. These artifacts and their factory value outlive the rendering edge; only the provider handle and rendered views belong to that edge. `reduceOutputEvents(events)` remains available for one-off replay.

Pane deserialization can precede activation or service publication. Restore the pane's identity synchronously, share its session with later activation, and attach arriving services to that same pane. Do not serialize live kernel handles, requests, or transport state. On runtime removal, retire pending requests and kernel-owned state; reactivate against newly published services and fresh sessions.

Canonical method shapes and registration examples live in the linked package contract documents. Read [Services](services.md) for general hub ownership and [Writing specs](writing-specs.md) for testing the lifecycle through the editor.
