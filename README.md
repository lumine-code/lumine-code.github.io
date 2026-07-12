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

Open `index.html` directly in a browser, or serve the folder:

```sh
python -m http.server
# then visit http://localhost:8000
```

## Deploying

This repo is named `lumine-code.github.io`, so GitHub Pages serves it at the org root automatically. In the repo's **Settings -> Pages**, set the source to the `main` branch root folder.

## License

MIT. See the [Lumine repository](https://github.com/lumine-code/lumine) for details.
