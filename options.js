// Options page: saves the API key to extension storage and reads it back.

const input = document.getElementById("apiKey");
const status = document.getElementById("status");

chrome.storage.sync.get("apiKey", ({ apiKey }) => {
  if (apiKey) input.value = apiKey;
});

document.getElementById("save").addEventListener("click", async () => {
  const apiKey = input.value.trim();
  await chrome.storage.sync.set({ apiKey });
  status.textContent = apiKey ? "Saved" : "Cleared";
  setTimeout(() => (status.textContent = ""), 1500);
});
