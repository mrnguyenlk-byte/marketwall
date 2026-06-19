import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"

import { UserRole } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/auth/password"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase()
        const password = credentials?.password?.toString()

        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null

        const valid = await verifyPassword(password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id
      }
      if (user?.role === UserRole.admin || user?.role === UserRole.user) {
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id
      }
      if (
        session.user &&
        (token.role === UserRole.admin || token.role === UserRole.user)
      ) {
        session.user.role = token.role
      }
      return session
    },
  },
})
