# lumine-code.github.io

The landing page for **[Lumine](https://github.com/lumine-code/lumine)**, a community-led, hyper-hackable text editor.

Served via GitHub Pages at **https://lumine-code.github.io**.

## Structure

```text
index.html      # single-page site
api/            # generated Lumine API reference (HTML and JSON)
docs/           # Markdown documentation rendered by docs.html
styles.css      # centered static styles, no build step
assets/         # logo assets
```

## Regenerating the API reference

Install the website's small documentation toolchain and run the generator:

```sh
npm install
npm run docs:api
```

The source repositories are declared in `api-sources.json`. The generator reads both Atomdoc and
JSDoc comments from each source, then rewrites `api/index.html` and `api/api.json`. Add another
manifest entry when another Lumine repository exposes documented public APIs.

## Local preview

Serve the folder over HTTP and open the printed URL:

```sh
npm start
# serves http://127.0.0.1:8000 (pass a port with `npm start -- 8080`)
```

The docs and API pages load Markdown and JSON with `fetch()`, so they must be served over HTTP — opening the HTML files directly from `file://` will not work.

## Deploying

This repo is named `lumine-code.github.io`, so GitHub Pages serves it at the org root automatically. In the repo's **Settings -> Pages**, set the source to the `main` branch root folder.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
