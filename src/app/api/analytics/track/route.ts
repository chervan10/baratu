import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

// Helper to fetch IP-based geolocation
async function getIpLocation(ip: string) {
  const defaultLocation = {
    country: "Moçambique",
    city: "Maputo",
    region: "Maputo Cidade",
    latitude: -25.9653,
    longitude: 32.5892
  };

  try {
    // Skip local/loopback IPs
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return defaultLocation;
    }

    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (res.ok) {
      const data = await res.json();
      if (!data.error) {
        return {
          country: data.country_name || defaultLocation.country,
          city: data.city || defaultLocation.city,
          region: data.region || defaultLocation.region,
          latitude: data.latitude ? parseFloat(data.latitude) : defaultLocation.latitude,
          longitude: data.longitude ? parseFloat(data.longitude) : defaultLocation.longitude
        };
      }
    }
  } catch (err) {
    console.error("IP Geolocation API error:", err);
  }

  return defaultLocation;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      visitorId, 
      deviceName, 
      deviceType, 
      browser, 
      browserVersion, 
      operatingSystem, 
      osVersion, 
      screenWidth, 
      screenHeight, 
      pixelRatio, 
      language, 
      timezone, 
      latitude, 
      longitude,
      sessionDuration
    } = body;

    if (!visitorId) {
      return NextResponse.json({ error: "visitorId é obrigatório." }, { status: 400 });
    }

    const durationSec = typeof sessionDuration === 'number' ? sessionDuration : 0;

    // 1. Check if this unique visitor already exists in DB (using visitorId or fingerprint prefix)
    const fingerprint = visitorId.split("-")[0];
    const existingVisitor = await prisma.visitorAnalytics.findFirst({
      where: {
        OR: [
          { visitorId },
          { visitorId: { startsWith: fingerprint + "-" } }
        ]
      }
    });

    if (existingVisitor) {
      // Unique visitor exists: Update session end and duration (Ignore duplicate visit insertion)
      const now = new Date();
      await prisma.visitorAnalytics.update({
        where: { id: existingVisitor.id },
        data: {
          sessionEnd: now,
          sessionDuration: Math.max(existingVisitor.sessionDuration, durationSec)
        }
      });

      // Try updating via Supabase JS client if env variables are configured
      const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (isSupabaseConfigured) {
        try {
          await supabase
            .from("visitor_analytics")
            .update({
              session_end: now.toISOString(),
              session_duration: Math.max(existingVisitor.sessionDuration, durationSec)
            })
            .eq("visitor_id", existingVisitor.visitorId);
        } catch (err) {
          console.error("Supabase update error:", err);
        }
      }

      return NextResponse.json({ success: true, isNew: false, visitorId: existingVisitor.visitorId });
    }

    // 2. Count existing unique visitors to enforce the 10 limit rule
    const uniqueCount = await prisma.visitorAnalytics.count();

    if (uniqueCount >= 10) {
      // Reached the limit: Stop collecting new records
      return NextResponse.json({ 
        success: false, 
        reason: "limit_reached", 
        message: "Limite de 10 visitantes únicos atingido. A recolha foi interrompida." 
      });
    }

    // 3. Fallback to IP Geolocation if browser coordinates are not provided
    let locationData = {
      country: "Moçambique",
      city: "Maputo",
      region: "Maputo Cidade",
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null
    };

    if (locationData.latitude === null || locationData.longitude === null) {
      const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
      const ip = rawIp.split(",")[0].trim();
      const ipLoc = await getIpLocation(ip);
      
      locationData.country = ipLoc.country;
      locationData.city = ipLoc.city;
      locationData.region = ipLoc.region;
      if (locationData.latitude === null) locationData.latitude = ipLoc.latitude;
      if (locationData.longitude === null) locationData.longitude = ipLoc.longitude;
    }

    // 4. Build visitor analytics record payload
    const now = new Date();
    const payload = {
      visitor_id: visitorId,
      device_name: deviceName || "Desktop",
      device_type: deviceType || "Desktop",
      browser: browser || "Desconhecido",
      browser_version: browserVersion || "Desconhecido",
      operating_system: operatingSystem || "Desconhecido",
      os_version: osVersion || "Desconhecido",
      screen_width: parseInt(screenWidth) || 1920,
      screen_height: parseInt(screenHeight) || 1080,
      pixel_ratio: parseFloat(pixelRatio) || 1,
      language: language || "pt",
      timezone: timezone || "Africa/Maputo",
      country: locationData.country,
      city: locationData.city,
      region: locationData.region,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      session_start: now.toISOString(),
      session_end: now.toISOString(),
      session_duration: durationSec,
      visit_date: now.toISOString().split("T")[0]
    };

    // 5. Save using Supabase JS client if available, else Prisma
    let saved = false;
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from("visitor_analytics").insert([payload]);
        if (!error) saved = true;
        else console.error("Supabase insert error:", error);
      } catch (err) {
        console.error("Supabase SDK execution error:", err);
      }
    }

    // Double save or fallback to local SQLite / server-level PostgreSQL via Prisma
    await prisma.visitorAnalytics.create({
      data: {
        visitorId: payload.visitor_id,
        deviceName: payload.device_name,
        deviceType: payload.device_type,
        browser: payload.browser,
        browserVersion: payload.browser_version,
        operatingSystem: payload.operating_system,
        osVersion: payload.os_version,
        screenWidth: payload.screen_width,
        screenHeight: payload.screen_height,
        pixelRatio: payload.pixel_ratio,
        language: payload.language,
        timezone: payload.timezone,
        country: payload.country,
        city: payload.city,
        region: payload.region,
        latitude: payload.latitude,
        longitude: payload.longitude,
        sessionStart: now,
        sessionEnd: now,
        sessionDuration: payload.session_duration,
        visitDate: new Date(payload.visit_date)
      }
    });

    console.log(`[Visitor Analytics] Saved new unique visitor: ${visitorId} from ${locationData.city}, ${locationData.country}`);

    return NextResponse.json({ success: true, isNew: true });

  } catch (error: any) {
    console.error("Error in visitor analytics tracking API:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: error.message },
      { status: 500 }
    );
  }
}
