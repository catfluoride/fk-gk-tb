# fk-gk-tb

Experimental Thunderbird add-on to override the outgoing email and HTTP/HTTPS `User-Agent` with a custom string or an automatically refreshed Chrome Stable User-Agent.

## Installation

Download `fk-gk-tb-v1.1.0.xpi` from [Releases](https://github.com/catfluoride/fk-gk-tb/releases). In Thunderbird open **Add-ons and Themes → gear → Install Add-on From File**, then choose the XPI.

## Usage

1. Open the **fk-gk-tb** toolbar popup.
2. Enter a custom single-line User-Agent string and enable **Outgoing email headers**, **HTTP/HTTPS requests**, or both.
3. Click **Apply**. To use Chrome's latest Stable major version, enable **Automatically use latest Chrome Stable User-Agent**, choose Linux/Windows/macOS, and select the checking interval (6, 12, 24, 72 or 168 hours).
4. **Fetch now** performs a one-time update without enabling scheduled checks. **Restore defaults** disables overrides and restores original mail preferences; do this before uninstalling.

## Implementation

The email override sets `mailnews.headers.useMinimalUserAgent=false` and `general.useragent.override` using a Thunderbird Experiment API. The HTTP override uses `webRequest.onBeforeSendHeaders`. Scheduled refreshes query the [Chrome for Testing Stable JSON feed](https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json), generating a reduced UA with `Chrome/MAJOR.0.0.0`; checks run while Thunderbird is open.

## Limitations

**Experimental; not runtime-tested in Thunderbird.** Verify outgoing email headers with received raw messages. HTTP interception may not cover Thunderbird's internal requests. Changing the User-Agent does not replace Gecko or materially change conventional browser market-share metrics. Only Chrome version metadata is requested; no mailbox content is sent by this feature. Permissions: `storage`, `alarms`, `webRequest`, `webRequestBlocking`, `<all_urls>`, and privileged Experiment API access.

## Build

```bash
zip -r fk-gk-tb-v1.1.0.xpi manifest.json background.js popup.html popup.js style.css api
```

## Credits and philosophy

This extension was **entirely vibe-coded with ChatGPT (OpenAI, GPT-6)**. ChatGPT generated the extension's code, interface, packaging, and initial documentation, working from the repository owner's requirements and feedback.

It's a small personal experiment, not a polished or independently audited product. If you don't like it, you can simply ignore it. Nobody is asking you to use it.

## References

[Thunderbird Experiments](https://developer.thunderbird.net/add-ons/mailextensions/experiments) · [Thunderbird webRequest](https://webextension-api.thunderbird.net/en/esr-mv2/webRequest.html) · [Chrome for Testing](https://github.com/GoogleChromeLabs/chrome-for-testing) · [User-Agent Reduction](https://developer.chrome.com/docs/privacy-security/user-agent-reduction)
