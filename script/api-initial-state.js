"use strict";

// Runs before styles and body parsing. The router reveals the selected class
// only after visibility, disclosure state and scrolling have been resolved.
document.documentElement.setAttribute("data-api-initializing", "");
history.scrollRestoration = "manual";
