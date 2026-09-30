# IPython and Jupyter cells

An `.ipy` file combines Python, IPython commands, and named cells in one source document. Install [`language-ipython`](https://github.com/lumine-code/language-ipython) for syntax highlighting, [`jupyter-cells`](https://github.com/lumine-code/jupyter-cells) for cell navigation and notebook conversion, and [`jupyter-repl`](https://github.com/lumine-code/jupyter-repl) to run code through a Jupyter kernel. Install these packages from **Settings → Install**. Add [`jupyter-view`](https://github.com/lumine-code/jupyter-view) to edit `.ipynb` files as notebooks.

## Writing a cell document

Start each cell with a column-zero `# %%` marker. Text after the marker is its title. Each additional `%` increases its outline level while still starting a new cell. Python before the first marker is an initial code cell.

```ipy
# %% Setup
directory = %pwd
files = !ls

# %% [markdown] Notes
# Analysis
Write **Markdown** literally, including headings and lists.

# %% [raw] Payload
Keep this text exactly as written: <tag> { unclosed

# %% Results
values = [1, 2, 3]
sum(values)
```

`[markdown]` and `[md]` select Markdown; `[raw]` selects raw. `[code]` explicitly selects code. The bare spellings `markdown`, `md`, and `raw` are code-cell titles. Metadata is case-sensitive and must be the first complete word after the percent run. A title such as `markdownish benchmark` is a code-cell title.

Markdown and raw bodies are literal source. A Markdown heading is `# Analysis`, without an extra Python comment prefix. Raw text keeps its `#` characters and is neither executed nor rendered as Markdown. Running a Markdown cell renders it locally without starting a kernel; running raw cells skips them.

Markers inside Python strings, bracketed expressions, continued expressions, or indented suites do not split cells. In a literal Markdown, raw, or foreign-language body, a column-zero `# %%` line is reserved as the next cell boundary. Indent that line when you intend it as body text.

Use `jupyter-cells:run-cell`, `jupyter-cells:run-cell-and-move-down`, or `jupyter-cells:run-all` to execute cells. The package also provides commands to select, reorder, navigate, and fold cells.

## Cell magics

A cell magic starts with `%%` on the first nonblank line of a code cell. Its arguments stay on that header line, and its body continues to the next cell marker or the end of the file. Put a new marker before a cell magic that follows other code or a comment.

```ipy
# %% Timing
%%timeit -n 3
sum(range(1000))

# %% Shell
%%bash -x
echo hello

# %% HTML
%%html --isolated
<h1>Results</h1>
```

`time`, `timeit`, `prun`, `debug`, `capture`, and `code_wrap` keep Python syntax. Known foreign magics use the corresponding installed language grammar: shell for `bash`, `sh`, `sx`, `system`, and `!`; HTML for `html` and `HTML`; Markdown for `markdown`; LaTeX for `latex`; JavaScript for `javascript` and `js`; XML for `svg` and `SVG`; Perl and Ruby for their names. `python`, `python2`, `python3`, and `pypy` bodies use the original Python grammar. Names are case-sensitive. `script`, `writefile`, `file`, `cmd`, and unknown magics retain a plain body.

Running at the cursor inside a cell magic runs the whole magic. When you run a selected fragment of its body, the execution packages prepend the complete original header, including arguments. For example, selecting only `echo hello` in the shell example still submits it with `%%bash -x`.

Line commands such as `%pwd`, shell escapes such as `!ls`, and assignment results such as `directory = %pwd` remain IPython syntax within code cells.

## Notebook syntax and execution

An `.ipynb` notebook stores each cell's type separately from its source. `jupyter-view` uses the original language package for a code cell, the Markdown package for a Markdown cell, and plain syntax for raw. A Python notebook cell containing `# %% [markdown]` remains a code cell; the comment does not change its stored type or divide it into source-file cells.

For a leading cell magic, the notebook keeps the header visible and parses the body with its original language grammar. A manual grammar choice takes precedence and is saved in the cell's language metadata. The body's selected grammar governs its highlighting, including whether it understands the kernel's extended syntax.

Syntax and kernel choice are separate. A cell with `%%bash` can be highlighted as shell while being submitted to the notebook's Python kernel, which handles the magic. Selecting HTML or Python syntax does not start a different kernel or convert a code cell into Markdown or raw.

## Importing and exporting notebooks

`jupyter-cells:import-notebook` opens a notebook as a source document. For a Python notebook, it creates literal `.ipy` code, Markdown, and raw cells and suggests an `.ipy` filename when you save. Saved results can appear inline when `jupyter-repl` is available. Other notebook languages retain their language's comment-prefixed non-code cells.

`jupyter-cells:export-notebook` writes the source document as an `.ipynb` notebook with code, Markdown, and raw cell types. Export does not require a running kernel; when one is available, its specification supplies the notebook's kernel metadata.

Marker headers are structure rather than cell source. One newline before the next marker separates cells and is excluded from the exported source. Additional trailing newlines belong to the preceding cell and are preserved. For example, leave a blank line before the next marker when the cell's source must end with a newline. Empty explicit cells remain cells, and the final cell keeps its source through the end of the file. Cell source normalizes CRLF and CR to LF for the notebook and execution protocol without stripping literal `#` prefixes.
