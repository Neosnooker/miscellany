/*******************************
 * miscellany/userjs: The custom user.js project.
 *******************************/

/**
 * Change the current preference value to the new value.
 * @param preference The preference to change.
 * @param value The new value.
 */
declare function user_pref(
  preference: string,
  value: string | boolean | number,
): void;

/** [SECTION 1]: Privacy **/
/* Internal browser behavior. */
// Enable native Firefox resistFingerprinting feature.
user_pref("privacy.resistFingerprinting", true);
user_pref("privacy.resistFingerprinting.letterboxing", true);

// Disable Firefox telemetry.
/// Toolkit telemetry
user_pref("toolkit.telemetry.*.enabled", false);
user_pref("toolkit.telemetry.unified", false);
user_pref("toolkit.telemetry.server", "");
user_pref("toolkit.telemetry.cachedClientID", "");
/// Data reporting.
user_pref("datareporting.healthreport.service.enabled", false);
user_pref("datareporting.healthreport.uploadEnabled", false);
user_pref("datareporting.policy.dataSubmissionEnabled", false);
user_pref("datareporting.policy.dataSubmissionEnabled", false);
/// Ping centre and onboarding.
user_pref("browser.ping-centre.telemetry", false);
user_pref("browser.onboarding.enabled", false);

// Disable Pocket, a Firefox built-in extension.
user_pref("extensions.pocket.enabled", false);
user_pref("extensions.pocket.showHome", false);
// Disable Firefox intrusive experiments and studies.
user_pref("app.normandy.enabled", false);
user_pref("messaging-system.rsexperimentloader.enabled", false);

// Disable updating of snippets.
user_pref("browser.aboutHomeSnippets.updateUrl", false);

// Disable Firefox "network detection," which sends a ping to its detectportal domain.
user_pref("network.captive-portal-service.enabled", false);
user_pref("network.connectivity-service.enabled", false);

// Do not send crash reports.
user_pref("breakpad.reportURL", "");
user_pref("browser.tabs.crashReporting.sendReport", false);

// Do not use Firefox Merino.
// Refer to https://mozilla-services.github.io/merino/ for more.
user_pref("browser.urlbar.merino.enabled", false);

/* Geolocation & Region */
// Use Mozilla geolocation service if permission is granted.
user_pref(
  "geo.provider.network.url",
  "https://location.services.mozilla.com/v1/geolocate?key=%MOZILLA_API_KEY%",
);
user_pref("geo.provider.use_geoclue", false);
/// Disable OS geolocation when the user uses Windows.
user_pref("geo.provider.ms-windows-location", false);

// Do not update region.
user_pref("browser.region.update.enabled", false);

/* Browser automatic update */
// Do not update without permission.
user_pref("app.update.auto", false);

// Notify during download.
user_pref("app.update.notifyDuringDownload", true);

/* Other features */
// Do not query search suggestions.
user_pref("browser.search.suggest.enabled", false);

// Disable push notifications.
user_pref("dom.webnotifications.enabled", false);

/**
 * [SECTION 2]: SECURITY
 */
// Enable HTTPS-only mode.
user_pref("dom.security.https_only_mode", true);
user_pref("dom.security.https_only_mode_pbm", true);

// Enforce TLS 1.3 (version 4 in browser), which breaks up to 80% of websites.
// user_pref("security.tls.version.min", 4);
// This configuration will be enforced in the future.

// Disable IPv6, which is associated with many security risks.
user_pref("network.dns.disableIPv6", true);

// Prevent leakage of internal IP address when using peer connection (WebRTC).
user_pref("media.peerconnection.ice.no_host", true);

// Disable speculative connection.
/// Link prefetch.
user_pref("network.prefetch-next", false);
/// DNS prefetch.
user_pref("network.dns.disablePrefetch", true);
/// Speculative pre-connections.
user_pref("network.http.speculative-parallel-limit", 0);
/// Network predictor.
user_pref("network.predictor.enabled", false);
/// Speculative connections from "browser.places" and URL bar.
user_pref("browser.places.speculativeConnect.enabled", false);
user_pref("browser.urlbar.speculativeConnect.enabled", false);

// Do not use service workers.
user_pref("dom.serviceWorkers.enabled", false);

/**
 * [SECTION 3]: Miscellaneous
 */
// Clear sponsored sites from the new tab page.
user_pref("browser.newtabpage.activity-stream.showSponsored", false);
user_pref("browser.newtabpage.activity-stream.showSponsoredTopSites", false);
user_pref("browser.newtabpage.activity-stream.default.sites", "");

// Do not show top stories.
user_pref("browser.newtabpage.activity-stream.feeds.section.topstories", false);

// Disable Firefox View.
user_pref("browser.tabs.firefox-view", false);

// Disable several browser urlbar.suggest topics.
user_pref("browser.urlbar.suggest.topsites", false);
user_pref("browser.urlbar.suggest.weather", false);

// Enable sanitizer.
user_pref("dom.security.sanitizer.enabled", true);
