"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

async function harness(t, read) {
  const dom = new JSDOM(
    '<div id="packages-list"><h2><a href="#package=org%2Fexample">example</a></h2></div><section id="package-details" hidden></section>',
    {
      url: "https://lumine-code.github.io/packages.html?q=example#package=org%2Fexample",
      runScripts: "outside-only",
    },
  );
  t.after(() => dom.window.close());
  const { window } = dom;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.fetch = read;
  for (const file of [
    "vendor/markdown-it.min.js",
    "vendor/purify.min.js",
    "package-catalog.js",
    "package-details.js",
  ])
    window.eval(fs.readFileSync(path.join(__dirname, file), "utf8"));
  const entries = window.LumineCatalog.normalize([
    {
      source: "org/example",
      metadata: { name: "example", description: "Current description." },
      selectedRef: { type: "default", value: "master" },
      refs: {
        defaultBranch: "master",
        headSha: "a".repeat(40),
        tags: [{ name: "v1.0.0", sha: "b".repeat(40) }],
      },
    },
  ]);
  window.LuminePackageDetails.initialize(entries);
  return window;
}
const response = (text) => ({ ok: true, text: async () => text });
async function settled() {
  for (let n = 0; n < 5; n++)
    await new Promise((resolve) => setImmediate(resolve));
}

test("package README is sanitized and links and images follow the selected version", async (t) => {
  const window = await harness(t, async (url) =>
    response(
      url.endsWith("package.json")
        ? JSON.stringify({
            version: "1.0.0",
            description: "Live description.",
            license: "MIT",
          })
        : '# Example\n\n<script>window.pwned=true</script><img src=".github/demo.png" onerror="alert(1)"><a href="javascript:alert(1)">bad</a>\n\n[Guide](docs/guide.md)',
    ),
  );
  await settled();
  const doc = window.document;
  assert.equal(doc.querySelector(".package-readme script"), null);
  assert.equal(
    doc.querySelector(".package-readme img").hasAttribute("onerror"),
    false,
  );
  assert.equal(
    doc.querySelector(".package-readme img").src,
    "https://raw.githubusercontent.com/org/example/master/.github/demo.png",
  );
  assert.equal(
    [...doc.querySelectorAll(".package-readme a")].find(
      (a) => a.textContent === "Guide",
    ).href,
    "https://github.com/org/example/blob/master/docs/guide.md",
  );
  assert.equal(
    doc.querySelector(".package-detail-description").textContent,
    "Live description.",
  );
  assert.equal(
    doc.querySelector(".package-readme").getAttribute("aria-busy"),
    "false",
  );
  const select = doc.querySelector("select");
  select.value = "tag:v1.0.0";
  select.dispatchEvent(new window.Event("change"));
  await settled();
  assert.match(
    doc.querySelector(".package-readme img").src,
    /\/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\//,
  );
  assert.equal(
    new URL(doc.querySelector(".package-install").href).searchParams.get(
      "source",
    ),
    "https://github.com/org/example.git#tag:v1.0.0",
  );
});

test("a slow previous version cannot replace the newly selected README", async (t) => {
  let finishOld;
  const window = await harness(t, (url) =>
    url.includes("/master/")
      ? new Promise((resolve) => {
          if (url.endsWith("README.md"))
            finishOld = () => resolve(response("# Old README"));
          else resolve(response("{}"));
        })
      : Promise.resolve(
          response(url.endsWith("package.json") ? "{}" : "# Tagged README"),
        ),
  );
  const select = window.document.querySelector("select");
  select.value = "tag:v1.0.0";
  select.dispatchEvent(new window.Event("change"));
  await settled();
  finishOld();
  await settled();
  assert.match(
    window.document.querySelector(".package-readme").textContent,
    /Tagged README/,
  );
  assert.doesNotMatch(
    window.document.querySelector(".package-readme").textContent,
    /Old README/,
  );
  window.document.querySelector(".package-back").click();
  await settled();
  assert.equal(window.document.getElementById("packages-list").hidden, false);
  assert.equal(window.location.search, "?q=example");
});

test("README failures preserve the selected version and its Install action", async (t) => {
  const window = await harness(t, async () => {
    throw new Error("offline");
  });
  await settled();
  assert.match(
    window.document.querySelector(".package-readme").textContent,
    /could not be loaded/,
  );
  assert.equal(
    window.document.querySelector(".package-install").textContent,
    "Install",
  );
  assert.equal(
    window.document.querySelector(".package-readme").getAttribute("aria-busy"),
    "false",
  );
});
