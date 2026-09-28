# Explain this with Claude

A Chrome extension that adds an **"Explain this with Claude"** item to the right-click menu.
Highlight any text on any page, right-click, and a small panel appears with a plain-English
explanation from Claude.

## The Tech Stack

- **Chrome Extension Manifest V3** with a service worker, a content script and an options page.
- **Vanilla JavaScript** throughout. No framework, no bundler, no build step.
- **Chrome APIs**: `contextMenus` for the right-click item, `storage.sync` for the API key,
  `tabs` and `scripting` for talking to the page.
- **Claude Messages API** called directly with `fetch`, using the `claude-opus-5` model.
- **Shadow DOM** for the floating panel so page styles and extension styles stay separate.
- **Plain HTML and CSS** for the settings page.

The whole thing is five source files plus three icons. Here is what each one does.

## File overview

| File | Runs where | Job |
|---|---|---|
| `manifest.json` | Read by Chrome | Describes the extension and wires the other files together |
| `background.js` | Service worker (no page) | Creates the menu item and calls the Claude API |
| `content.js` | Inside every web page | Draws the floating explanation panel |
| `options.html` | Extension settings page | Form for entering your API key |
| `options.js` | Extension settings page | Saves and loads the API key |
| `icons/` | Toolbar and extensions page | The extension logo at 16, 48 and 128 pixels |

## manifest.json

The manifest is the extension's table of contents. Chrome reads it first and learns:

- the name, version and description shown on the extensions page,
- which permissions the extension needs (`contextMenus` for the right-click item, `storage` for
  the API key, `scripting` and `activeTab` for injecting the panel on demand),
- that it may talk to `https://api.anthropic.com`,
- that `background.js` is the service worker, `content.js` runs on every page, and
  `options.html` is the settings page,
- where the icons live.

Nothing in the manifest is code. If a file is not listed here, Chrome does not know it exists.

## background.js

The service worker is the extension's "brain". It has no visible UI and only wakes up when
something happens. It does three things:

1. **Registers the menu item.** When the extension is installed it creates a context-menu entry
   that only appears when text is selected.
2. **Calls Claude.** When the item is clicked it reads your API key from extension storage, sends
   the selected text to the Claude Messages API with a short system prompt asking for a concise
   plain-English explanation, and pulls the text out of the response.
3. **Talks to the page.** It sends three kinds of messages to the tab: a loading message straight
   away, then either the explanation or an error. If the page was already open before the
   extension was installed, the content script is not there yet, so it injects it first.

The API call includes the `anthropic-dangerous-direct-browser-access` header. The API refuses
browser-originated requests without it. That is fine for a personal extension where the key is
your own, but a shipped product should route the call through your own server so the key never
lives in the browser.

## content.js

The content script runs inside the web page, so it is the only file that can draw on it. It
listens for the messages from `background.js` and renders a fixed panel in the bottom-right
corner showing the highlighted snippet and the explanation, a loading state, or an error.

The panel lives in a **shadow DOM**, which means the page's own CSS cannot restyle it and the
panel's CSS cannot leak into the page. A small guard at the top stops it from being set up twice
if it is injected on demand into a page that already had it.

## options.html and options.js

Together these make the settings page you reach by right-clicking the extension icon and
choosing **Options**. The HTML is a single password-style input and a Save button. The script
loads any existing key into the input on open and writes the new value to `chrome.storage.sync`
on save. The service worker reads the same storage key, so the API key never appears in code.

## icons/

Three PNGs of the same logo. Chrome uses the 16 pixel version in the toolbar, 48 on the
extensions page, and 128 in the Web Store and install dialog. Replace the files with your own
artwork, keeping the names, and reload the extension.

## Running it

1. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and choose
   this folder.
2. Right-click the extension icon, choose **Options**, and paste a key from
   [console.anthropic.com](https://console.anthropic.com/).
3. Highlight some text on any page, right-click, and pick **Explain this with Claude**.

After editing any file, click the reload arrow on the extension card so Chrome picks up the change.

## Contributions

This repository does not accept contributions, issues or pull requests. The code is here for
you to use: clone it or fork it and build your own version.
