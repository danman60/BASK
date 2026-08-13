"use client";

import { useEffect } from "react";

/**
 * obs-beacon — answers one question: did a stakeholder actually open this demo?
 *
 * Not product analytics. The unit is the PERSON, not the pageview: send a link with
 * ?s=their-name and every event in that visit attributes to them.
 *
 * Writes to public.obs_beacon_events in CC&SS. RLS is insert-only for anon, so the
 * public key below can add rows but can never read them back.
 *
 * Self-exclusion: visit ?obs=off once and this browser stops reporting forever
 * (localStorage). Without it, our own testing looks like stakeholder traffic.
 */

const APP = "bask";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function ObsBeacon() {
  useEffect(() => {
    if (!URL || !KEY) return;

    try {
      const params = new URLSearchParams(window.location.search);

      // Opt out of our own traffic, permanently, per browser.
      if (params.get("obs") === "off") {
        localStorage.setItem("obs_ignore", "1");
        return;
      }
      if (localStorage.getItem("obs_ignore") === "1") return;

      // Stakeholder tag persists across navigation within the visit.
      const tagged = params.get("s");
      if (tagged) sessionStorage.setItem("obs_stakeholder", tagged.slice(0, 60));
      const stakeholder = sessionStorage.getItem("obs_stakeholder");

      let sessionId = sessionStorage.getItem("obs_session");
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem("obs_session", sessionId);
      }

      const endpoint = `${URL}/rest/v1/obs_beacon_events`;
      const started = Date.now();

      const send = (event: string, dwellMs?: number) => {
        const body = JSON.stringify({
          app: APP,
          path: window.location.pathname,
          stakeholder,
          session_id: sessionId,
          event,
          dwell_ms: dwellMs ?? null,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent.slice(0, 300),
          screen: `${window.screen.width}x${window.screen.height}`,
        });

        // sendBeacon survives tab close; fetch does not. It cannot set custom headers,
        // so the keys ride along as query params (PostgREST accepts both).
        const beaconUrl = `${endpoint}?apikey=${encodeURIComponent(KEY)}`;
        const blob = new Blob([body], { type: "application/json" });
        if (!navigator.sendBeacon?.(beaconUrl, blob)) {
          fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: KEY,
              Authorization: `Bearer ${KEY}`,
            },
            body,
            keepalive: true,
          }).catch(() => {});
        }
      };

      send("pageview");

      // One dwell event when they leave, so "opened it and bounced" is
      // distinguishable from "actually read it".
      let closed = false;
      const finish = () => {
        if (closed) return;
        closed = true;
        send("dwell", Date.now() - started);
      };
      const onVisibility = () => {
        if (document.visibilityState === "hidden") finish();
      };

      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("pagehide", finish);

      return () => {
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pagehide", finish);
      };
    } catch {
      // Observability must never break the demo it is watching.
    }
  }, []);

  return null;
}
