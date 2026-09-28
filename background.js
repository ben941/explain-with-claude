// Service worker: registers the right-click menu, calls Claude, sends the answer to the tab.
const MENU_ID = "explain-with-claude";
const SYSTEM = "You explain highlighted text from web pages in plain English. Be concise: two to " +
  "four short sentences. Define jargon, give context, skip preamble. Do not use markdown.";

chrome.runtime.onInstalled.addListener(() =>
  chrome.contextMenus.create({ id: MENU_ID, title: "Explain this with Claude", contexts: ["selection"] })
);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const text = (info.selectionText || "").trim();
  if (info.menuItemId !== MENU_ID || !tab?.id || !text) return;
  await send(tab.id, { type: "EXPLAIN_LOADING", text });
  try {
    await send(tab.id, { type: "EXPLAIN_RESULT", text, explanation: await explain(text) });
  } catch (err) {
    await send(tab.id, { type: "EXPLAIN_ERROR", text, error: err.message });
  }
});

async function send(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch { // page was open before install, so content.js isn't there yet: inject it
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
    await chrome.tabs.sendMessage(tabId, message);
  }
}

async function explain(text) {
  const { apiKey } = await chrome.storage.sync.get("apiKey");
  if (!apiKey) throw new Error("No API key set. Open the extension's Options page to add one.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-5", max_tokens: 1024, output_config: { effort: "low" }, system: SYSTEM,
      messages: [{ role: "user", content: `Explain this:\n\n${text}` }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Claude API returned ${res.status}`);
  if (data.stop_reason === "refusal") throw new Error("Claude declined to explain this selection.");
  return data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}
