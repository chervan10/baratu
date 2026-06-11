import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "Sessão terminada com sucesso."
  });

  // Clear the admin session cookie by setting it with an expired date
  response.cookies.set("admin_session", "", {
    expires: new Date(0),
    path: "/",
  });

  return response;
}
