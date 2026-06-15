"use client";

import { useEffect, useRef } from "react";
import { UAParser } from "ua-parser-js";

// Helper to generate a browser fingerprint synchronously
const generateFingerprint = (): string => {
  if (typeof window === "undefined") return "ssr";
  
  const screenSpec = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const language = navigator.language || "";
  const timezone = new Date().getTimezoneOffset().toString();
  const userAgent = navigator.userAgent || "";
  
  const rawData = `${screenSpec}|${language}|${timezone}|${userAgent}`;
  
  // Quick djb2 hash function for strings
  let hash = 5381;
  for (let i = 0; i < rawData.length; i++) {
    hash = (hash * 33) ^ rawData.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
};

export function VisitorTracker() {
  const visitorIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    startTimeRef.current = Date.now();

    // 1. Initialize Unique IDs (Local Storage & Session Storage)
    let localStorageId = localStorage.getItem("baratu_visitor_id");
    if (!localStorageId) {
      localStorageId = crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("baratu_visitor_id", localStorageId);
    }

    let sessionStorageId = sessionStorage.getItem("baratu_session_id");
    if (!sessionStorageId) {
      sessionStorageId = crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem("baratu_session_id", sessionStorageId);
    }

    // Fingerprint combined with local storage ID is our unique visitorId
    const fingerprint = generateFingerprint();
    const uniqueVisitorId = `${fingerprint}-${localStorageId.substring(0, 8)}`;
    visitorIdRef.current = uniqueVisitorId;

    // 2. Parse User Agent for system info
    const parser = new UAParser();
    const uaResult = parser.getResult();

    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
    const parsedDeviceType = uaResult.device.type 
      ? uaResult.device.type.charAt(0).toUpperCase() + uaResult.device.type.slice(1) 
      : (isMobileDevice ? "Mobile" : "Desktop");
      
    const parsedDeviceName = uaResult.device.model 
      ? `${uaResult.device.vendor || ""} ${uaResult.device.model}`.trim()
      : (isMobileDevice ? "Smartphone" : "Computador");

    const trackingPayload = {
      visitorId: uniqueVisitorId,
      deviceName: parsedDeviceName,
      deviceType: parsedDeviceType,
      browser: uaResult.browser.name || "Desconhecido",
      browserVersion: uaResult.browser.version || "Desconhecido",
      operatingSystem: uaResult.os.name || "Desconhecido",
      osVersion: uaResult.os.version || "Desconhecido",
      screenWidth: window.screen.width || 0,
      screenHeight: window.screen.height || 0,
      pixelRatio: window.devicePixelRatio || 1,
      language: navigator.language || "pt",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Maputo",
      latitude: null as number | null,
      longitude: null as number | null,
      sessionDuration: 0
    };

    // Helper to post tracking details to server
    const sendTrackingData = async (payload: typeof trackingPayload) => {
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true
        });
      } catch (err) {
        console.warn("Analytics tracking request failed:", err);
      }
    };

    // 3. Obtain Geolocation (HTML5 API check with 3s timeout)
    const initTrackingWithGeo = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const updatedPayload = {
              ...trackingPayload,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            };
            sendTrackingData(updatedPayload);
          },
          () => {
            // Permission denied or error - fallback to server IP-based geo
            sendTrackingData(trackingPayload);
          },
          { timeout: 3000 }
        );
      } else {
        sendTrackingData(trackingPayload);
      }
    };

    initTrackingWithGeo();

    // 4. Setup heartbeat interval (every 15 seconds) to update session duration
    intervalRef.current = setInterval(() => {
      const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      
      const heartbeatPayload = {
        visitorId: uniqueVisitorId,
        sessionDuration: elapsedSeconds
      };

      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(heartbeatPayload),
        keepalive: true
      }).catch((err) => console.warn("Session heartbeat failed:", err));
    }, 15000);

    // 5. Setup final unload listener
    const handleUnload = () => {
      const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      const unloadPayload = JSON.stringify({
        visitorId: uniqueVisitorId,
        sessionDuration: elapsedSeconds
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/track", unloadPayload);
      } else {
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: unloadPayload,
          keepalive: true
        });
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, []);

  return null; // behaviour-only tracker component
}
