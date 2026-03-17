document.getElementById("open-app").addEventListener("click", function () {
  chrome.tabs.create({ url: "http://localhost:3000" });
});
