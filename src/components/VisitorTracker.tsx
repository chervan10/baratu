"use client";

import { useEffect, useRef } from "react";

export function VisitorTracker() {
  const visitorIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") return;

    const detectBrowser = () => {
      const ua = navigator.userAgent;
      let tem;
      let M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
      
      if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return "IE " + (tem[1] || "");
      }
      if (M[1] === "Chrome") {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem != null) return tem.slice(1).join(" ").replace("OPR", "Opera");
      }
      M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, "-?"];
      if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
      return M.join(" ");
    };

    const getOS = () => {
      const userAgent = window.navigator.userAgent;
      const platform = (window.navigator as any).userAgentData?.platform || window.navigator.platform || "";
      const macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"];
      const windowsPlatforms = ["Win32", "Win64", "Windows", "wintarget"];
      const iosPlatforms = ["iPhone", "iPad", "iPod"];

      let os = "Unknown OS";
      if (macosPlatforms.indexOf(platform) !== -1) {
        os = "macOS";
      } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = "iOS";
      } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = "Windows";
      } else if (/Android/.test(userAgent)) {
        os = "Android";
      } else if (/Linux/.test(platform)) {
        os = "Linux";
      } else if (/iPhone|iPad|iPod/.test(userAgent)) {
        os = "iOS";
      }
      return os;
    };

    const initTracker = async () => {
      // 1. Detect device type
      const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
      const mobileStatus = isMobileDevice ? "Mobile" : "Desktop";

      // 2. Detect browser and OS specs
      const browser = detectBrowser();
      const os = getOS();
      const screenSpec = `${window.screen.width}x${window.screen.height}`;
      const pixelRatio = window.devicePixelRatio ? `@${window.devicePixelRatio}x` : "";
      const memory = (navigator as any).deviceMemory ? ` | ${ (navigator as any).deviceMemory }GB RAM` : "";
      const cores = navigator.hardwareConcurrency ? ` | ${navigator.hardwareConcurrency} Cores` : "";
      
      const phoneSpec = `${os} (${screenSpec}${pixelRatio})${memory}${cores}`;

      // 3. Fetch Location via IP Geolocation API
      let locationText = "Unknown Location";
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          if (data.city && data.country_name) {
            locationText = `${data.city}, ${data.country_name}`;
          } else if (data.country_name) {
            locationText = data.country_name;
          }
        }
      } catch (err) {
        // Fallback to secondary location provider
        try {
          const res = await fetch("https://geolocation-db.com/json/");
          if (res.ok) {
            const data = await res.json();
            if (data.city && data.country_name) {
              locationText = `${data.city}, ${data.country_name}`;
            } else if (data.country_name) {
              locationText = data.country_name;
            }
          }
        } catch (subErr) {
          console.warn("Failed to fetch location:", subErr);
        }
      }

      // 4. Create visitor record on the server
      try {
        const res = await fetch("/api/visitors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mobile: mobileStatus,
            location: locationText,
            browser,
            sessionTime: 0,
            phoneSpec,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.visitorId) {
            visitorIdRef.current = data.visitorId;
          }
        }
      } catch (err) {
        console.error("Failed to register visitor session:", err);
      }
    };

    // Initialize the tracker
    initTracker();

    // 5. Setup periodic heartbeat interval (every 10s)
    intervalRef.current = setInterval(async () => {
      if (!visitorIdRef.current) return;
      const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

      try {
        await fetch("/api/visitors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: visitorIdRef.current,
            sessionTime: elapsedSeconds,
          }),
          keepalive: true, // Keep connection open during navigation
        });
      } catch (err) {
        console.warn("Heartbeat failed:", err);
      }
    }, 10000);

    // 6. Send final session updates on page unload
    const handleUnload = () => {
      if (!visitorIdRef.current) return;
      const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

      const payload = JSON.stringify({
        id: visitorIdRef.current,
        sessionTime: elapsedSeconds,
      });

      // Use beacon API if supported, fallback to fetch keepalive
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/visitors", payload);
      } else {
        fetch("/api/visitors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: payload,
          keepalive: true,
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

  return null; // This is a behavior-only tracker component
}
