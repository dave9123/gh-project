import { withAuth } from "next-auth/middleware";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {},
  {
    callbacks: {
      authorized: async ({ token, req }) => {
        const cookieStore = await cookies();
        const backendJWT = cookieStore.get("x-backend-jwt");
        console.log("MIDDLEWARE, backendJWT", backendJWT, token);

        if (req.nextUrl.pathname.includes("/dashboard") && !token) {
          return false;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
