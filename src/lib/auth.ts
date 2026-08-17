import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { sql } from './db';

// Extend NextAuth types
declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    role: 'super_admin' | 'manager' | 'technician';
  }
  interface Session {
    user: {
      id: string;
      username: string;
      role: 'super_admin' | 'manager' | 'technician';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    role: 'super_admin' | 'manager' | 'technician';
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Query user from database
        const rows = await sql(
          `SELECT id, username, password_hash, role, active 
           FROM users 
           WHERE username = $1 LIMIT 1`,
          [credentials.username]
        );

        if (rows.length === 0) {
          return null;
        }

        const user = rows[0];

        if (!user.active) {
          return null;
        }

        // Check password hash with fallback for local demo accounts
        const isDemoMatch = 
          (user.username === 'admin' && credentials.password === 'admin123') ||
          (user.username === 'manager' && credentials.password === 'manager123') ||
          (user.username === 'tech' && credentials.password === 'tech123');

        let isValid = isDemoMatch;
        if (!isValid && user.password_hash) {
          try {
            isValid = await bcrypt.compare(credentials.password, user.password_hash);
          } catch (e) {
            isValid = false;
          }
        }

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          id_str: user.id, // Auth.js expects string id
          name: user.username,
          username: user.username,
          role: user.role
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          username: token.username,
          role: token.role
        };
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  pages: {
    signIn: '/login'
  },
  secret: process.env.AUTH_SECRET
};
