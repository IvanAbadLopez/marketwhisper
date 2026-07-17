import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/shared/api/prisma";
import { checkRateLimit, getClientIp } from "@/shared";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        console.log('[AUTH] authorize called with:', { email: credentials?.email, hasPassword: !!credentials?.password });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials');
          return null;
        }

        const ip = getClientIp(request as Request);
        const rateLimitResult = checkRateLimit(`login:${ip}`, {
          max: 5,
          windowMs: 15 * 60 * 1000,
        });

        if (!rateLimitResult.success) {
          console.log('[AUTH] Rate limit exceeded for IP:', ip);
          throw new Error('Too many login attempts. Please try again later.');
        }

        console.log('[AUTH] Looking for user:', credentials.email);
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          console.log('[AUTH] User not found');
          return null;
        }

        if (!user.password) {
          console.log('[AUTH] User has no password');
          return null;
        }

        console.log('[AUTH] User found, comparing passwords...');
        console.log('[AUTH] Password hash starts with:', user.password.substring(0, 10));
        
        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        console.log('[AUTH] Password match result:', passwordMatch);

        if (!passwordMatch) {
          console.log('[AUTH] Password does not match');
          return null;
        }

        console.log('[AUTH] Login successful for user:', user.email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
