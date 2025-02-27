import NextAuth from "next-auth";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";
import { jwtVerify, SignJWT } from "jose";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    async encode({ secret, token, maxAge }) {
      if (!secret) {
        throw new Error("Missing secret in JWT encode");
      }
      const effectiveSecret = new TextEncoder().encode(
        typeof secret === "string" ? secret : secret.toString()
      );
      return await new SignJWT(token)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(maxAge ? `${maxAge}s` : "24h")
        .sign(effectiveSecret);
    },
    async decode({ secret, token }) {
      if (!token) {
        return null;
      }
      if (!secret) {
        throw new Error("Missing secret in JWT decode");
      }
      const effectiveSecret = new TextEncoder().encode(
        typeof secret === "string" ? secret : secret.toString()
      );
      try {
        const { payload } = await jwtVerify(token, effectiveSecret);
        return payload;
      } catch (error) {
        console.error("JWT decode error:", error);
        return null;
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
