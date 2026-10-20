"use strict";
const $ = id => document.getElementById(id);
const setStatus = (message, error = false) => {$("status").textContent = message; $("status").className = error ? "error" : "";};
function updateEnabled() {$("agent").readOnly = $("auto").checked;}
async function load() {
  const c = await browser.storage.local.get(["agent", "mailEnabled", "httpEnabled", "autoEnabled", "platform", "intervalHours", "lastUpdated", "chromeVersion", "updateError"]);
  $("agent").value = c.agent || ""; $("mail").checked = !!c.mailEnabled; $("http").checked = !!c.httpEnabled;
  $("auto").checked = !!c.autoEnabled; $("platform").value = c.platform || "linux";
  $("interval").value = String(c.intervalHours || 24); updateEnabled();
  $("last").textContent = c.lastUpdated ? `Chrome Stable ${c.chromeVersion || ""} · Last updated: ${new Date(c.lastUpdated).toLocaleString()}` : "No Chrome version fetched yet.";
  if (c.updateError) setStatus(`Last update failed: ${c.updateError}`, true);
}
async function apply() {
  const autoEnabled = $("auto").checked, mailEnabled = $("mail").checked, httpEnabled = $("http").checked;
  const agent = $("agent").value.trim();
  if (!autoEnabled && (mailEnabled || httpEnabled) && (!agent || /[\r\n\0]/.test(agent))) {
    setStatus("Enter a valid, single-line User-Agent.", true); return;
  }
  $("apply").disabled = true;
  try {
    const store = await browser.storage.local.get(["originalPrefs", "agent"]);
    if (mailEnabled && !autoEnabled) {
      if (!store.originalPrefs) await browser.storage.local.set({originalPrefs: await browser.userAgentPrefs.capture()});
      await browser.userAgentPrefs.applyMail(agent);
    } else if (!mailEnabled && store.originalPrefs) {
      await browser.userAgentPrefs.restore(store.originalPrefs);
      await browser.storage.local.set({originalPrefs: null});
    }
    await browser.storage.local.set({
      agent: autoEnabled ? (store.agent || agent) : agent, mailEnabled, httpEnabled, autoEnabled,
      platform: $("platform").value, intervalHours: Number($("interval").value)
    });
    if (autoEnabled) {await browser.runtime.sendMessage({type: "updateChromiumNow"}); await load();}
    setStatus("Applied.");
  } catch (err) {setStatus(String(err.message || err), true);}
  finally {$("apply").disabled = false;}
}
async function fetchNow() {
  $("fetch").disabled = true;
  try {
    await browser.storage.local.set({platform: $("platform").value});
    const result = await browser.runtime.sendMessage({type: "updateChromiumNow"});
    await load(); setStatus(`Updated to Chrome Stable ${result.version}.`);
  } catch (err) {setStatus(String(err.message || err), true);}
  finally {$("fetch").disabled = false;}
}
async function restore() {
  $("restore").disabled = true;
  try {
    const {originalPrefs} = await browser.storage.local.get("originalPrefs");
    if (originalPrefs) await browser.userAgentPrefs.restore(originalPrefs);
    await browser.storage.local.set({agent: "", mailEnabled: false, httpEnabled: false, autoEnabled: false, originalPrefs: null, updateError: ""});
    await load(); setStatus("Previous preferences restored; overrides and updates disabled.");
  } catch (err) {setStatus(String(err.message || err), true);}
  finally {$("restore").disabled = false;}
}
$("apply").addEventListener("click", apply);
$("fetch").addEventListener("click", fetchNow);
$("restore").addEventListener("click", restore);
$("auto").addEventListener("change", updateEnabled);
load().catch(err => setStatus(String(err.message || err), true));
