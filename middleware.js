import { NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "./src/lib/supabaseServer";

export async function middleware(request) {
  const response = NextResponse.next();

  // Login page itself must stay public, everything else under /admin is gated.
  if (request.nextUrl.pathname.startsWith("/admin/login")) {
    return response;
  }

  const supabase = createSupabaseMiddlewareClient(request, response);
  const { data } = await supabase.auth.getSession();

  if (request.nextUrl.pathname.startsWith("/admin") && !data.session) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"]
};
