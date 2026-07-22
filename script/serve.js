"use strict";

// Minimal static file server for previewing the site locally. The docs and API
// pages load Markdown/JSON with `fetch()`, so they must be served over HTTP
// rather than opened from `file://`. Uses only Node built-ins — no dependency.

const fs = require("fs");
const http = require("http");
const path = require("path");

const siteRoot = path.resolve(__dirname, "..");
const port = Number(process.argv[2] || process.env.PORT || 8000);
const host = "127.0.0.1";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
};

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent(request.url.split("?")[0]);
  let filePath = path.join(siteRoot, requestPath);

  // Keep every request inside the site root.
  if (!filePath.startsWith(siteRoot)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (!error && stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (readError, contents) => {
      if (readError) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("404 Not Found");
        return;
      }

      const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
      response.writeHead(200, { "Content-Type": contentType });
      response.end(contents);
    });
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Pass a different port, e.g. \`npm start -- 8080\`.`);
  } else {
    console.error(error.message);
  }
  process.exit(1);
});

server.listen(port, host, () => {
  const base = `http://${host}:${port}`;
  console.log(`Serving ${siteRoot}`);
  console.log(`  Landing page   ${base}/`);
  console.log(`  Docs           ${base}/docs.html`);
  console.log(`  API reference  ${base}/api/`);
  console.log("Press Ctrl+C to stop.");
});
