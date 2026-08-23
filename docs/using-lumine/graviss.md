# FEM models

Lumine's **`graviss`** package opens finite element models in an interactive engineering viewport. Install it from the Install pane in **Settings**, or with `lumine --install lumine-code/graviss`. It draws no format itself: a source package supplies the model, and `graviss-sofistik` reads SOFiSTiK CDB databases while `graviss-meshio` reads the formats meshio understands. Install whichever matches the models you work with.

What you open is a `.grv` file — a small JSON view document naming the model it draws and how you want it drawn. The narrowest complete one is `{ "source": "model.dat" }`, and everything else in it is optional; a graphic that states no camera frames the model, and one that states no appearance follows your theme. Open the same file as text with `graviss:open-source` whenever you want to see or edit what it holds.

## Moving around

Drag to orbit, drag with the middle button to pan, and use the wheel to zoom. By default the orbit pivots on whatever element is under the pointer and the zoom moves along the ray under it, so the thing you are looking at stays where it is; both are settings, as is whether the zoom settles over a few frames or arrives in one step.

A focused viewport handles its own keys. `graviss:fit-view` (`f`) frames the whole model, `graviss:view-isometric` (`i`), `graviss:view-top` (`t`), `graviss:view-front` (`e`) and `graviss:view-right` (`r`) take the standard orientations, and there are commands for every corner and edge view besides. `graviss:perspective-projection` (`p`) and `graviss:orthographic-projection` (`o`) switch how the model is projected. The arrow keys pan, `alt` with them rotates, and `+` and `-` zoom.

`graviss:toggle-members` (`m`), `graviss:toggle-shells` (`s`), `graviss:toggle-nodes` (`n`), `graviss:toggle-supports` (`u`) and `graviss:toggle-mesh` (`w`) show and hide what the model is made of, and `graviss:toggle-section-rendering` (`d`) switches between members drawn as their extruded cross-sections and members drawn as plain lines.

## Graphics

One `.grv` file holds as many named graphics as you like, and each keeps its own camera, its own visibility, its own appearance and its own print region. Step between them with `graviss:previous-graphic` (`[`) and `graviss:next-graphic` (`]`), and add or delete them from the toolbar. A graphic also remembers what you were looking at in the analysis and what you had narrowed the model down to, so one document can hold an animated mode shape, a static dead-load case and an unfiltered overview side by side.

Everything you change is recorded in the document, which means **Undo** and **Redo** cover the view as well as the text — including the camera.

## Narrowing a model

`graviss:toggle-filter-panel` (`c`) opens a dock panel that decides which elements are drawn. Every kind — beams, trusses, cables, shells, springs, couplings — has its own switch, its own colour and a count of how many of it survived whatever is currently narrowing the model.

The number field takes what every analysis tool takes: `1-10` for a range, `15` for one element, `1*` for anything starting with one, and `11??` for eleven followed by exactly two more digits, separated by commas or spaces. Below it are whichever dimensions the source declared — groups, materials, the geometric axis a member was generated along. Graviss interprets none of them; it shows the names the source gave and narrows by what you tick. A dimension an element was never placed on does not narrow it, so filtering by something that only applies to line elements leaves the slabs alone.

## Results

`graviss:toggle-results-panel` (`v`) opens the panel that shows what the model was solved for, when the source can supply it. Pick a load case from the list — step it with the arrow keys or the wheel, which moves a cursor and reads the case once you stop, since reading one is thousands of records.

The amplification is yours: **Auto** picks a factor that makes the largest displacement a readable fraction of the model, and the presets and the slider override it. ×0 puts the model back exactly where it was, which is how you see what moved against what did not.

**Play** animates the case. A load case runs up from the undeformed shape and back, because it is a real state of the structure; a mode shape swings about zero instead, because it has no sign — the viewer picks the right one from what the source says the case is, and you can override it. **Sweep the cases** steps through the list instead of swinging, holding each case still.

**Colour by displacement** reads the model as a field rather than as a structure, with a legend giving the ends of the scale in the unit you would say them in. Members bend between their ends rather than being drawn as straight chords, when the source supplies the rotations that say how.

Press `escape` in either panel to hand focus back to the model.

## Printing and export

`graviss:save-as-image` renders the active graphic to a PNG and `graviss:copy-to-clipboard` puts it on the clipboard. What gets rendered is the print region if the graphic has one: hold the modifier and drag a rectangle over the canvas, or use `graviss:set-print-region-from-view` to take whatever the viewport currently covers. `graviss:auto-select` frames the structure exactly and `graviss:auto-select-with-border` leaves a margin; `graviss:clear-print-region` drops it and covers the whole model again.
