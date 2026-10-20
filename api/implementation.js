"use strict";
var userAgentPrefs = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    const prefs = Services.prefs;
    const minName = "mailnews.headers.useMinimalUserAgent";
    const uaName = "general.useragent.override";
    const captureOne = (name, kind) => {
      const exists = prefs.prefHasUserValue(name);
      if (!exists) return {exists: false};
      return {exists: true, value: kind === "bool" ? prefs.getBoolPref(name) : prefs.getStringPref(name)};
    };
    return { userAgentPrefs: {
      async capture() {return {minimal: captureOne(minName, "bool"), override: captureOne(uaName, "string")};},
      async applyMail(value) {
        if (!value || /[\r\n\0]/.test(value)) throw Error("Invalid User-Agent");
        prefs.setBoolPref(minName, false); prefs.setStringPref(uaName, value);
      },
      async restore(original) {
        if (!original?.minimal || !original?.override) throw Error("Missing saved preferences");
        for (const [name, data, kind] of [[minName, original.minimal, "bool"], [uaName, original.override, "string"]]) {
          if (data.exists) {
            if (kind === "bool") prefs.setBoolPref(name, data.value);
            else prefs.setStringPref(name, data.value);
          } else if (prefs.prefHasUserValue(name)) prefs.clearUserPref(name);
        }
      }
    }};
  }
};
