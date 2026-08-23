import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { sql } from './db';

export type UserRole = 'owner' | 'super_admin' | 'manager' | 'technician' | 'platform_admin';

// Extend NextAuth type definitions
declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    organizationId?: string;
    orgName?: string;
    orgSlug?: string;
    role: UserRole;
    subscriptionStatus?: string;
    planSlug?: string;
    isPlatformAdmin: boolean;
  }
  interface Session {
    user: {
      id: string;
      username: string;
      organizationId: string;
      orgName: string;
      orgSlug: string;
      role: UserRole;
      subscriptionStatus: string;
      planSlug: string;
      isPlatformAdmin: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    organizationId: string;
    orgName: string;
    orgSlug: string;
    role: UserRole;
    subscriptionStatus: string;
    planSlug: string;
    isPlatformAdmin: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Nom d’utilisateur / Email', type: 'text' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // 1. Fetch user by username or email
        const userRows = await sql(
          `SELECT id, username, email, password_hash, active, is_platform_admin 
           FROM users 
           WHERE username = $1 OR email = $1 
           LIMIT 1`,
          [credentials.username.trim()]
        );

        if (userRows.length === 0) {
          return null;
        }

        const user = userRows[0];

        if (!user.active) {
          return null;
        }

        // 2. Validate password hash
        let isValid = false;
        if (user.password_hash) {
          try {
            isValid = await bcrypt.compare(credentials.password, user.password_hash);
          } catch (e) {
            isValid = false;
          }
        }

        if (!isValid) {
          return null;
        }

        // 3. Fetch Organization Membership
        let membership: any = null;
        try {
          const memberRows = await sql(
            `SELECT 
               om.role, 
               om.organization_id, 
               om.branch_id, 
               o.name as org_name, 
               o.slug as org_slug, 
               o.subscription_status, 
               p.slug as plan_slug
             FROM organization_members om
             JOIN organizations o ON om.organization_id = o.id
             LEFT JOIN plans p ON o.plan_id = p.id
             WHERE om.user_id = $1
             LIMIT 1`,
            [user.id]
          );
          membership = memberRows[0] || null;
        } catch (e) {
          console.warn('[AUTH] Organization members lookup notice:', e);
        }

        // Fallback: If no organization_members entry, check user.organization_id directly
        if (!membership && user.organization_id) {
          try {
            const orgRows = await sql(
              `SELECT o.id as organization_id, o.name as org_name, o.slug as org_slug, o.subscription_status, p.slug as plan_slug
               FROM organizations o
               LEFT JOIN plans p ON o.plan_id = p.id
               WHERE o.id = $1
               LIMIT 1`,
              [user.organization_id]
            );
            if (orgRows.length > 0) {
              membership = {
                role: user.role || 'technician',
                organization_id: orgRows[0].organization_id,
                branch_id: null,
                org_name: orgRows[0].org_name,
                org_slug: orgRows[0].org_slug,
                subscription_status: orgRows[0].subscription_status,
                plan_slug: orgRows[0].plan_slug,
              };
            }
          } catch (e) {
            console.warn('[AUTH] Organization fallback notice:', e);
          }
        }

        // Determine effective role
        let effectiveRole: UserRole = 'technician';
        if (user.is_platform_admin) {
          effectiveRole = 'platform_admin';
        } else if (membership) {
          effectiveRole = (membership.role as UserRole) || (user.role as UserRole) || 'owner';
        } else if (user.role) {
          effectiveRole = user.role as UserRole;
        }

        return {
          id: user.id,
          name: user.username,
          username: user.username,
          organizationId: membership?.organization_id || user.organization_id || '00000000-0000-0000-0000-000000000001',
          orgName: membership?.org_name || 'Atelier Principal',
          orgSlug: membership?.org_slug || 'atelier-principal',
          role: effectiveRole,
          subscriptionStatus: membership?.subscription_status || 'active',
          planSlug: membership?.plan_slug || 'pro',
          isPlatformAdmin: Boolean(user.is_platform_admin),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.organizationId = user.organizationId || '';
        token.orgName = user.orgName || '';
        token.orgSlug = user.orgSlug || '';
        token.role = user.role;
        token.subscriptionStatus = user.subscriptionStatus || 'active';
        token.planSlug = user.planSlug || 'pro';
        token.isPlatformAdmin = user.isPlatformAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          username: token.username,
          organizationId: token.organizationId,
          orgName: token.orgName,
          orgSlug: token.orgSlug,
          role: token.role,
          subscriptionStatus: token.subscriptionStatus,
          planSlug: token.planSlug,
          isPlatformAdmin: token.isPlatformAdmin,
        };
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.AUTH_SECRET,
};
