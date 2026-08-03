# Porting Tree-sitter queries

Most Tree-sitter grammars already ship query files, and nvim-treesitter carries a set for almost every grammar in existence. None of them can be used in Lumine as they are.

The reason is that Neovim puts a layer of indirection between a query and a colour. A query captures `@keyword.function`, a _highlight group_, and the colour scheme decides what that looks like. Lumine has no such layer: a capture name **is** the TextMate scope applied to the text, so `@keyword.function` would be applied literally and match nothing any theme styles.

Porting a query therefore means rewriting every capture. `script/port-nvim-queries.js` does the mechanical part and tells you exactly what it could not do.

## What actually needs porting

Only `highlights.scm`. The rest of the query types share most of their vocabulary with upstream already:

| Query            | Portability                                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `tags.scm`       | Identical. `@name`, `@definition.*` and `@reference.*` mean the same thing here. Copy the upstream file verbatim — not nvim's.           |
| `locals.scm`     | Near-identical. Lumine wants a bare `@local.definition`, so `@local.definition.function` loses its tail.                                 |
| `folds.scm`      | Upstream's bare `@fold` is what Lumine wants. `@fold.start`/`@fold.end` and the `#set! fold.*` settings are additions, not replacements. |
| `indents.scm`    | **Do not port.** See below.                                                                                                              |
| `injections.scm` | No equivalent. Injections are declared in `lib/main.js` with `atom.grammars.addInjectionPoint`.                                          |

### Why indents are different

Upstream indents use `@indent.begin`, `@indent.end`, `@indent.branch`, `@indent.align`, `@indent.zero` and `@indent.ignore`. Lumine uses `@indent`, `@dedent`, `@dedent.next` and `@match`, plus `#set! indent.matchIndentOf`, `indent.offsetIndent` and `capture.final`.

Those are not two spellings of one model — they are two different models, and there is no rule that maps one onto the other. A machine translation produces indentation that looks plausible and is wrong in ways a fixture will not catch, because fixtures assert scopes, not indent behaviour. The tool copies the upstream file to `indents.scm.nvim-reference` and stops. Write the real one by hand, starting from whichever bundled grammar is structurally closest.

## Running the tool

```sh
node script/port-nvim-queries.js <upstream-queries-dir> --out <package>/grammars/tree-sitter-<lang> \
     --segment <lang> [--report port.json]

# Once you think you are done
node script/port-nvim-queries.js --verify <package>/grammars --segment <lang>

# Print the capture map as a table (this page's table is generated from it)
node script/port-nvim-queries.js --emit-map
```

`--segment` is the language segment every emitted scope ends with, and it is not always the package name — `text.html.basic` takes `--segment html`. Use `--lang-token` instead when the queries are shared between two grammars and the config sets `treeSitter.languageSegment`.

The tool is **one-shot scaffolding and is not idempotent**. Re-running it over hand-edited output destroys the edits. Never wire it into a build or into CI.

## What it guarantees, and what it does not

It guarantees that what it emits **compiles**. That is a low bar on purpose: a query that compiles can still capture nothing at all, and the tool has no way to know.

Everything it could not settle is left in two places — a `; PORT:` marker in the file header, and the report. `--verify` fails while any marker remains, and also fails on any scope that does not end in the language segment. So "the port is finished" is a command you can run, not a judgement you have to make.

Captures fall into four tiers:

- **safe** — a rename, applied silently.
- **review** — a defensible guess that depends on the language. `@comment`, `@string` and `@type` are always in here.
- **split** — _not_ a rename. One upstream capture corresponds to two or more Lumine patterns, so the tool leaves the capture untouched and `--verify` catches it.
- **drop** — no equivalent; routed to `@_IGNORE_.<name>`, which keeps the pattern's structure intact without applying a scope.

## What you still have to do, every time

1. **Resolve every `split`.** Punctuation is the big one: upstream writes `["(" ")"] @punctuation.bracket`, but Lumine wants a separate opening and closing pattern naming what is being delimited — `punctuation.definition.arguments.begin.bracket.round.<lang>` and `.end.…`.
2. **Add string and comment punctuation.** `punctuation.definition.string.begin`/`.end` and `punctuation.definition.comment` are the two most common scopes across the bundled grammars, and upstream queries essentially never have them.
3. **Split `@comment` by node type** into `comment.line.<style>` and `comment.block`, usually with `(#is? test.type …)` or a `#match?` on the delimiter.
4. **Move injections into `lib/main.js`.** The report names each language it saw.
5. **Write `indents.scm`.**
6. **Confirm the rules capture.** Compiling is not capturing. Build a `Query` against the committed wasm and run `.captures()` over a real sample, and check that no capture is declared but never matched.

## Predicates

Lumine implements a different predicate set from Neovim. The tool translates what it can, comments out what it cannot, and reports both.

| Upstream                                                                                       | Status                                 | Action                                                                                               |
| ---------------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `#eq?` `#not-eq?` `#match?` `#not-match?` `#any-of?` `#not-any-of?`                            | Implemented by the query engine itself | Passed through                                                                                       |
| `#is?` `#is-not?` with `test.*`, `#set!` with `adjust.*` / `capture.*` / `indent.*` / `fold.*` | Lumine's own                           | Emitted unchanged                                                                                    |
| `#has-ancestor?` / `#has-parent?`                                                              | Expressible                            | Rewritten as `#is? test.descendantOfType` / `#is? test.childOfType`                                  |
| `#offset!`                                                                                     | Partly expressible                     | A column-only shift becomes `adjust.offsetStart`/`adjust.offsetEnd`; a row delta cannot be expressed |
| `#lua-match?` `#vim-match?` `#contains?`                                                       | Not implemented                        | Removed and reported. Lua patterns are not regular expressions — rewrite by hand as `#match?`        |
| `#set! injection.*`                                                                            | By design                              | Removed; injections belong in `lib/main.js`                                                          |
| `#set! conceal` / `priority` / `url`, `#gsub!`, `#trim!`                                       | Not implemented                        | Removed and reported                                                                                 |

A wrong predicate is worse than a missing one. An unknown `test.`/`adjust.`/`capture.` key drops the affected capture and warns _once per grammar, in dev mode only_ — which in practice means silently. That is why the tool removes what it cannot translate instead of leaving it in place to fail quietly.

Lumine's `test.*` vocabulary: `type`, `hasError`, `injection`, `root`, `first`, `last`, `firstOfType`, `lastOfType`, `firstTextOnRow`, `lastTextOnRow`, `descendantOfType`, `childOfType`, `ancestorOfType`, `parentOfType`, `ancestorTypeNearerThan`, `rangeWithData`, `descendantOfNodeWithData`, `startsOnSameRowAs`, `endsOnSameRowAs`, `config`, `final`, `shy`.

Its `adjust.*` vocabulary: `startAt`, `endAt`, `offsetStart`, `offsetEnd`, `startAndEndAroundFirstMatchOf`, `startBeforeFirstMatchOf`, `startAfterFirstMatchOf`, `endBeforeFirstMatchOf`, `endAfterFirstMatchOf`.

## Helper captures

Upstream marks captures that exist only so a predicate can refer to them with a leading underscore. Lumine spells this `@_IGNORE_`, and the tool rewrites `@_url` to `@_IGNORE_.url`.

The separating dot is not cosmetic. The scope resolver recognises `_IGNORE_` and `_IGNORE_.…` and nothing else, so `@_IGNORE__url` would be applied to the text as a real scope.
