// Content script: receives the explanation and shows it in a floating panel.
(() => {
  if (window.__explainWithClaudeLoaded) return; // guard against double injection
  window.__explainWithClaudeLoaded = true;

  const CSS = `
    .box { position: fixed; right: 20px; bottom: 20px; width: 360px; max-height: 60vh; overflow: auto;
      z-index: 2147483647; box-sizing: border-box; background: #1e1e22; color: #f2f2f2; border-radius: 12px;
      padding: 14px 16px; font: 14px/1.5 -apple-system, Segoe UI, Roboto, sans-serif;
      box-shadow: 0 8px 30px rgba(0,0,0,.35); display: flex; flex-direction: column; gap: 8px; }
    .head { display: flex; justify-content: space-between; align-items: center; }
    .title { font-weight: 600; font-size: 13px; color: #d9c7ff; }
    .close { background: none; border: 0; color: #aaa; font-size: 18px; cursor: pointer; line-height: 1; }
    .quote { font-size: 12px; color: #aaa; border-left: 2px solid #555; padding-left: 8px;
      white-space: pre-wrap; max-height: 60px; overflow: hidden; }
    .body { white-space: pre-wrap; }
    .loading { color: #bbb; font-style: italic; }
    .error { color: #ff8a80; }`;

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "EXPLAIN_LOADING") render(msg.text, "Asking Claude…", "loading");
    if (msg.type === "EXPLAIN_RESULT") render(msg.text, msg.explanation, "");
    if (msg.type === "EXPLAIN_ERROR") render(msg.text, msg.error, "error");
  });

  // Small helper: create an element with a class and text content.
  const el = (tag, className, text) =>
    Object.assign(document.createElement(tag), { className, textContent: text });

  function render(selected, body, state) {
    let panel = document.getElementById("explain-with-claude-panel");
    if (!panel) {
      panel = Object.assign(document.createElement("div"), { id: "explain-with-claude-panel" });
      panel.attachShadow({ mode: "open" });
      document.documentElement.appendChild(panel);
    }
    const close = el("button", "close", "×");
    close.onclick = () => panel.remove();
    const head = el("div", "head");
    head.append(el("span", "title", "Explain this with Claude"), close);
    const snippet = selected.length > 200 ? selected.slice(0, 200) + "…" : selected;
    const box = el("div", "box");
    box.append(head, el("div", "quote", snippet), el("div", `body ${state}`, body));
    panel.shadowRoot.replaceChildren(el("style", "", CSS), box);
  }
})();
