## What is it?

![Preview GIF](static/preview.gif)

-   Reproduce an audio file
-   Tweak listening experience by changing: volume, playback speed, looping...
-   Add comments to desired timestamps
-   Quickly jump to a specific timestamp by left-clicking on the related comment
-   Modify/Delete a comment by right-clicking on it
-   Inuitive keyboard shortcut

````
``` annotate-audio
source: [[My Audio.mp3]]
volume: 0.5
speed: 1
loop: false
sticky: false
title:
autoplay: true
layout: 1

37 --- Section 1
162 --- Section 2
174 --- Section 3
```
````

### Options

**They can be tweaked more easly using the modal.**
Only `source` is required, the others are all facoltative. The order is not important but it need to have the options before the comments.

| Layout | Name       | Default     | Values              | Description                                                                                               |
| ------ | ---------- | ----------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| \*     | `source`   |             |                     | WikiLink to the audio file to reproduce                                                                   |
| \*     | `volume`   | `0.5`       | `0.0` → `1.0`       | Player base volume                                                                                        |
| \*     | `speed`    | `1`         | `0.0` → `1.0`       | Player playback speed                                                                                     |
| \*     | `loop`     | `false`     | `true`/`false`      | Loop-back to beginning after getting to the end of the audio                                              |
| \*     | `sticky`   | `false`     | `true`/`false`      | Main controls become sticky, following you as you scroll down                                             |
| \*     | `layout`   | `0`         | `0,1`               | What player layout to display (feel free to make your own)                                                |
| \*     | `chunk`    | `undefined` | `HH:MM:SS-HH:MM:SS` | Section of audio to play                                                                                  |
| \*     | `autoplay` | `false`     | `true`/`false`      | When clicking on a comment, the player starts playing from there instead of simply moving there           |
| 1      | `title`    | `undefined` |                     | Title of the player. If not present: not shown. If not set: name of audio file (or its alias, if present) |

### Obsidian Commands

| Name             | Action                                                 |
| ---------------- | ------------------------------------------------------ |
| `Add audiobox`   | Insert an already-configured audio-box inside the note |
| `Insert comment` | Insert a comment in the last interacted audio-box      |

---

## Development

### Road-Map

1. Use Web Workers to optimize audio loading
2. Add more useful obsidian commands
3. Follow native folder exclusion in the audio file search
4. UI to control `chunk` (like "Aves")
5. Layout with all the properties exposed
6. Render markdown even when modifying a comment (https://github.com/nothingislost/obsidian-cm6-attributes)

### Known Issues

-   Remove `currentTime` CAUSE redundant: use `this.player.currenTime`
-   After some seconds, it crashes the Obsidian mobile app
-   (LayoutDefault.vue) The wavegraph is not always loaded reliably. Sometimes, the wrong values are cached, requiring a cleaning
-   Remove `editMode` flag as it's redundant
-   Player is umounted and mounted when a comment is added. It would be better to have an update.
-   After using `Add audiobox` command, better handle the rendering by moving outside
-   `Insert comment` command is not removed when there's no active player
-   Better propagate the instruction to use cached values FROM "ParentApp" TO layouts
-   Only re-calculate wavegraph IF `chunk` has changed
-   "maxDuration" reference is not correctly passed to "getChunkOption"

### Changelog

-   **1.2.0**
    -   feat: Select audio source on `Add audiobox` command using a modal
    -   feat: Add modal to manage player properties more easily
    -   feat: Options cache handling
    -   feat: Render "404" block when `source` is invalid/absent
    -   fix: Removed alias as possible `title` option (useless)
    -   fix: Cache wavegraph rendering
-   **1.1.0**
    -   Allow each player to be independent by creating its refs in `ParentApp.vue` and passing them as `props`. To use targeted Obsidian commands, each player is called by its `id`
    -   feat [#1](https://github.com/12-VidE/annotate-audio/issues/1): Added Obsidian command `Insert comment`
    -   feat: [#3](https://github.com/12-VidE/annotate-audio/issues/3) Added `autoplay` option
    -   fix: Render `LayoutDefault` even when property `title` is not present
    -   fix: Player always strat from start of `chunk`
-   **1.0.0**
    -   Complete redesign, moving from Vue "Options API" to "Composition API". This will allow better flexibility in the future
    -   feat: Add ability to reproduce a `chunk` of the total audio
    -   feat: Allow to choose beetween different `layout`s
    -   fix [#2](https://github.com/12-VidE/annotate-audio/issues/2): Change `comment` style so it doesn't conflict with Obsidian native one
-   **0.1.1**
    -   fix: Renamed `Add Audio-Box` command to `Add audiobox` to follow "Plugin gidelines"
    -   feat: Show `source` alias as title if it exists and `title` option is `undefined`
-   **0.1.0 -** Initial release

---

## Credits

-   **Original Repo:** ["obsidian-audio-player" by noonesimg](https://github.com/noonesimg/obsidian-audio-player)
-   **Other Fork:** ["obsidian-enhanced-audio-player" by Yidaotus](https://github.com/Yidaotus/obsidian-enhanced-audio-player)
-   **Other Fork:** ["obsidian-audio-player" by dtkav](https://github.com/dtkav/obsidian-audio-player)
