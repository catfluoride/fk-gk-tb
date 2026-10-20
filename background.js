"use strict";
const FEED = "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json";
const ALARM = "chromium-ua-update";
let httpActive = false, httpUA = "", updateInProgress = null;
browser.webRequest.onBeforeSendHeaders.addListener(details => {
  if (!httpActive || !httpUA || details.url.startsWith(FEED)) return {};
  const headers = details.requestHeaders || [];
  const header = headers.find(h => h.name.toLowerCase() === "user-agent");
  if (header) header.value = httpUA;
  else headers.push({name: "User-Agent", value: httpUA});
  return {requestHeaders: headers};
}, {urls: ["http://*/*", "https://*/*"]}, ["blocking", "requestHeaders"]);
async function refreshHttp() {
  const {agent = "", httpEnabled = false} = await browser.storage.local.get(["agent", "httpEnabled"]);
  httpUA = agent; httpActive = httpEnabled && !!agent;
}
function chromeUA(version, platform) {
  const major = Number(String(version).split(".")[0]);
  if (!Number.isInteger(major) || major < 100 || major > 999) throw Error("Unexpected Chrome version");
  const os = platform === "windows" ? "Windows NT 10.0; Win64; x64" :
    platform === "mac" ? "Macintosh; Intel Mac OS X 10_15_7" : "X11; Linux x86_64";
  return `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36`;
}
async function updateChromeAgent() {
  if (updateInProgress) return updateInProgress;
  updateInProgress = (async () => {
    const settings = await browser.storage.local.get(["platform", "mailEnabled"]);
    const response = await fetch(FEED, {cache: "no-store"});
    if (!response.ok) throw Error(`Chrome feed HTTP ${response.status}`);
    const json = await response.json();
    const version = json?.channels?.Stable?.version;
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(version || "")) throw Error("Invalid Chrome version feed");
    const agent = chromeUA(version, settings.platform || "linux");
    if (settings.mailEnabled) {
      let {originalPrefs} = await browser.storage.local.get("originalPrefs");
      if (!originalPrefs) {
        originalPrefs = await browser.userAgentPrefs.capture();
        await browser.storage.local.set({originalPrefs});
      }
      await browser.userAgentPrefs.applyMail(agent);
    }
    await browser.storage.local.set({agent, chromeVersion: version, lastUpdated: Date.now(), updateError: ""});
    return {version, agent};
  })();
  try {return await updateInProgress;}
  catch (err) {await browser.storage.local.set({updateError: String(err.message || err)}); throw err;}
  finally {updateInProgress = null;}
}
async function schedule() {
  await browser.alarms.clear(ALARM);
  const {autoEnabled = false, intervalHours = 24} = await browser.storage.local.get(["autoEnabled", "intervalHours"]);
  if (autoEnabled) {
    const hours = [6, 12, 24, 72, 168].includes(Number(intervalHours)) ? Number(intervalHours) : 24;
    browser.alarms.create(ALARM, {periodInMinutes: hours * 60});
    await updateChromeAgent().catch(console.error);
  }
}
browser.alarms.onAlarm.addListener(a => {if (a.name === ALARM) updateChromeAgent().catch(console.error);});
browser.runtime.onMessage.addListener(message => {
  if (message?.type === "updateChromiumNow") return updateChromeAgent();
});
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.agent || changes.httpEnabled) refreshHttp().catch(console.error);
  if (changes.autoEnabled || changes.intervalHours) schedule().catch(console.error);
});
refreshHttp().catch(console.error);
