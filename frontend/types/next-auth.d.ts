import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  type UserRole = "Intipocket-SuperAdmin" | "Intipocket-Admin" | "Client";
  type UserSession = {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    role?: UserRole;
  };
  interface Session {
    backendJwt?: string;
    role?: string;
    user: UserSession;

    cookieBackendJwt?: string;
  }

  interface User extends DefaultUser {
    backendJwt?: string;
    role?: UserRole | undefined;
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendJwt?: string;
    role?: UserRole | undefined;
    cookieBackendJwt?: string;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      NEXTAUTH_URL?: string;
      NEXTAUTH_URL_INTERNAL?: string;

      PROD_URL?: string;
      STAGING_URL?: string;

      NEXTAUTH_SECRET?: string;
      AUTH_SECRET?: string;
      INTERNAL_API_KEY?: string;
      BACKEND_URL?: string;
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
      BACKEND_JWT?: string;

      VERCEL?: "1";
    }
  }
}
