"use strict";

// Minimal static file server for previewing the site locally. The docs and API
// pages load Markdown/JSON with `fetch()`, so they must be served over HTTP
// rather than opened from `file://`. Uses only Node built-ins — no dependency.

const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");

const siteRoot = path.resolve(__dirname, "..");
const startPort = Number(process.argv[2] || process.env.PORT || 8000);
const maxPortAttempts = 20;
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

// Open a URL in the platform's default browser.
function openBrowser(url) {
  const opener =
    process.platform === "win32"
      ? { command: "cmd", args: ["/c", "start", "", url] }
      : process.platform === "darwin"
        ? { command: "open", args: [url] }
        : { command: "xdg-open", args: [url] };
  spawn(opener.command, opener.args, { stdio: "ignore", detached: true }).unref();
}

// Try `port`; if it is taken, walk upward until a free one is found. Each
// attempt gets its own one-time error handler; the shared `listening` handler
// below fires once, for whichever port actually binds.
function listen(port, attemptsLeft) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      console.log(`Port ${port} is in use, trying ${port + 1}...`);
      listen(port + 1, attemptsLeft - 1);
    } else if (error.code === "EADDRINUSE") {
      console.error(`No free port found in ${startPort}-${startPort + maxPortAttempts}.`);
      process.exit(1);
    } else {
      console.error(error.message);
      process.exit(1);
    }
  });

  server.listen(port, host);
}

server.once("listening", () => {
  // Drop the pending retry error handler and log runtime errors plainly.
  server.removeAllListeners("error");
  server.on("error", (error) => console.error(error.message));

  const base = `http://${host}:${server.address().port}`;
  console.log(`Serving ${siteRoot}`);
  console.log(`  Landing page   ${base}/`);
  console.log(`  Docs           ${base}/docs.html`);
  console.log(`  API reference  ${base}/api/`);
  console.log("Press Enter to open in your browser, Ctrl+C to stop.");

  // Enter (a blank line on stdin) opens the landing page in the browser.
  if (process.stdin.isTTY) {
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", () => openBrowser(base + "/"));
  }
});

listen(startPort, maxPortAttempts);
