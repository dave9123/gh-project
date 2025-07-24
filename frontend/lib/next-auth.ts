import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { cookies } from "next/headers";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, profile }) {
      const cookieStore = await cookies();

      console.log("profile", profile, user);

      if (!profile) {
        return false;
      }

      try {
        // Call backend to sync user & get JWT
        // const res = await fetch(
        //   `${process.env.BACKEND_URL}/api/internal/auth/oauth`,
        //   {
        //     method: "POST",
        //     headers: {
        //       "Content-Type": "application/json",
        //       Authorization: "Bearer trytologin",
        //       ...(process.env.INTERNAL_API_KEY && {
        //         "X-API-KEY": process.env.INTERNAL_API_KEY,
        //       }),
        //     },
        //     body: JSON.stringify({
        //       provider: "google",
        //       providerId: profile.sub,
        //       name: profile.name,
        //       email: profile.email,
        //       image: profile.image,
        //     }),
        //   }
        // );
        // if (!res.ok) return false;
        // const response = await res.json();
        // const { token } = response;
        // user.backendJwt = token;
        // user.role = response.user.role;
        // cookieStore.set("x-backend-jwt", token, {
        //   httpOnly: true,
        //   path: "/",
        //   maxAge: 60 * 60 * 24 * 7, // 1 week
        //   sameSite: "lax", // or 'strict'
        //   secure: process.env.NODE_ENV === "production",
        // });
      } catch (error) {
        console.log(`an Error occured! ${error}`);
        return false;
      }
      return true;
    },

    async jwt({ token, user }) {
      const cookieStore = await cookies();
      const backendJWT = cookieStore.get("x-backend-jwt");

      if (backendJWT && "value" in backendJWT) {
        token.cookieBackendJwt = backendJWT.value;
      } else {
        token.cookieBackendJwt = "";
      }

      // console.log("JWT");
      // console.log(token);
      // console.log(user);
      if (user?.backendJwt) {
        token.backendJwt = user.backendJwt;
      }
      if (user?.role) {
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (token?.backendJwt) {
        session.backendJwt = token.backendJwt;
      }
      if (token?.role) {
        session.user.role = token.role;
        session.role = token.role;
      }

      session.cookieBackendJwt = token.cookieBackendJwt;
      // console.log("SESSIOn ", token);
      return session;
    },
  },
};
