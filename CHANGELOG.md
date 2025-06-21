## 1.5.0 - Localization

The plugin now supports localization. It currently includes "English" and "Italian" translations.

-   _feat ([#11](https://github.com/12-VidE/annotate-audio/issues/11))_ - Everything is now precise to the millisecond
-   _feat ([#11](https://github.com/12-VidE/annotate-audio/issues/11))_ - New option `decimals`

#### 1.5.1

-   _lang_([#12](https://github.com/12-VidE/annotate-audio/pull/12)) - Added chinese (zh-cn) localization - [Moyf](https://github.com/Moyf)
-   _fix_([#13](https://github.com/12-VidE/annotate-audio/issues/13)) - `chunk` option in codeblock is now correctly identified and converted to format with millisecond

## 1.4.0

-   _feat ([#4](https://github.com/12-VidE/annotate-audio/issues/4))_ - Each codeblock now has its own ID to better handle them
-   _feat ([#6](https://github.com/12-VidE/annotate-audio/issues/6))_ - New option `unstoppable`
-   _feat_ - new "Geek" `layout`
-   _fix ([#6](https://github.com/12-VidE/annotate-audio/issues/6))_ - Audio resumes after a comment is created/deleted
-   _fix_ - `chunk` is resetted correctly

#### 1.4.1

Substantial tidy up of my spaghetti code

-   _fix_ - "Default" layout works better on small screens
-   _fix_ - Less padding on time-stamps

#### 1.4.2

-   _fix ([#8](https://github.com/12-VidE/annotate-audio/issues/8)) ([#9](https://github.com/12-VidE/annotate-audio/issues/9))_ - Codeblock is re-written only on unload
-   _fix ([#9](https://github.com/12-VidE/annotate-audio/issues/9))_ - Cache only on audiobox unmounting
-   _style ([#10](https://github.com/12-VidE/annotate-audio/pull/10))_ - More specific CSS selectors - [Moyf](https://github.com/Moyf)
-   _style ([#10](https://github.com/12-VidE/annotate-audio/pull/10))_ - Better buttons cursor behaviour - [Moyf](https://github.com/Moyf)

## 1.3.0 - Mobile Support

([#4](https://github.com/12-VidE/annotate-audio/issues/4)) The plugin is now supported on mobile! (Not tested on iPhone)

-   _feat_ - Reset `chunk` option from the modal
-   _feat_ - More Obsidian commands
-   _fix ([#5](https://github.com/12-VidE/annotate-audio/issues/5))_ - Stop audiobox when another one start playing
-   _fix_ - Obsidian commands are shown only when they can be correctly applied

## 1.2.0

-   _feat_ - Select audio source on `Add audiobox` command using a modal
-   _feat_ - Add modal to manage player properties more easily
-   _feat_ - Options + Wavegraph cache handling
-   _feat_ - Render "404" layout when `source` option is invalid/absent
-   _fix_ - Removed alias as possible `title` option (useless)

#### 1.2.1

-   _fix_ - Read audio duration from metadata. It drastically decreases loading time

## 1.1.0 - Independent

Allow each player to be independent by creating its refs in `ParentApp.vue` and passing them as `props`. To use targeted Obsidian commands, each player is called by its `id`

-   _feat ([#1](https://github.com/12-VidE/annotate-audio/issues/1))_ - Added Obsidian command `Insert comment`
-   _feat: ([#3](https://github.com/12-VidE/annotate-audio/issues/3))_ - Added `autoplay` option
-   _fix_ - Render `LayoutDefault` even when options `title` is not present
-   _fix_ - Player always starts from start of `chunk`

## 1.0.0 - Composition API

Complete redesign, moving from Vue "Options API" to "Composition API". This will allow better flexibility in the future

-   _feat_ - Add ability to reproduce a `chunk` of the total audio
-   _feat_ - Allow to choose beetween different `layout`s
-   _fix ([#2](https://github.com/12-VidE/annotate-audio/issues/2))_ - Change `comment` style so it doesn't conflict with Obsidian native one

## 0.1.0 - Initial Release

First draft, written from scratch using the official template and some plugins as reference

#### 0.1.1

-   _feat_ - Show `source` alias as title if it exists and `title` option is `undefined`
-   _fix_ - Renamed `Add Audio-Box` command to `Add audiobox` to follow "Plugin gidelines"
