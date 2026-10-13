"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { search } = require("./api-search");

const entries = [
  {
    id: "class-texteditor",
    name: "TextEditor",
    owner: "",
    text: "edit source text",
  },
  {
    id: "texteditor-gettext",
    name: "getText",
    owner: "TextEditor",
    text: "read the buffer contents",
  },
  {
    id: "texteditor-settext",
    name: "setText",
    owner: "TextEditor",
    text: "replace the buffer contents",
  },
  {
    id: "texteditor-gettextrange",
    name: "getTextInBufferRange",
    owner: "TextEditor",
    text: "read a section",
  },
  {
    id: "buffer-gettext",
    name: "getText",
    owner: "TextBuffer",
    text: "read the buffer contents",
  },
];

test("exact member names rank ahead of prefixes and description matches", () => {
  const found = search(entries, "getText");
  assert.deepEqual(
    found.results.map(({ id }) => id),
    ["buffer-gettext", "texteditor-gettext", "texteditor-gettextrange"],
  );
});

test("qualified names accept API notation, punctuation, whitespace and case", () => {
  for (const query of [
    "TextEditor::getText()",
    " texteditor . GETTEXT ",
    "TextEditor getText",
  ]) {
    assert.equal(search(entries, query).results[0].id, "texteditor-gettext");
  }
  assert.equal(search(entries, "TEXTEDITOR").results[0].id, "class-texteditor");
});

test("multiple words can find a capability in its description", () => {
  assert.equal(
    search(entries, "replace contents").results[0].id,
    "texteditor-settext",
  );
  assert.equal(search(entries, "unknown operation").total, 0);
});

test("empty searches stay empty and result limits retain the full match count", () => {
  for (const query of ["", "  ", "::()"])
    assert.deepEqual(search(entries, query), { total: 0, results: [] });
  const found = search(entries, "getText", 1);
  assert.equal(found.total, 3);
  assert.equal(found.results.length, 1);
});
