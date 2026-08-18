import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      org_name,
      org_slug,
      owner_name,
      username,
      email,
      phone,
      password,
      plan_slug,
    } = body;

    if (!org_name || !username || !password) {
      return NextResponse.json(
        { error: 'Veuillez remplir les informations obligatoires (Nom de l’atelier, nom d’utilisateur, mot de passe).' },
        { status: 400 }
      );
    }

    // Clean slug
    const generatedSlug = (org_slug || org_name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // 1. Check if slug already exists
    const existingOrg = await sql(
      `SELECT id FROM organizations WHERE slug = $1 LIMIT 1`,
      [generatedSlug]
    );
    if (existingOrg.length > 0) {
      return NextResponse.json(
        { error: 'Un garage avec cet identifiant d\'URL existe déjà. Veuillez en choisir un autre.' },
        { status: 400 }
      );
    }

    // 2. Check if username already exists
    const existingUser = await sql(
      `SELECT id FROM users WHERE username = $1 LIMIT 1`,
      [username.trim()]
    );
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Ce nom d\'utilisateur est déjà utilisé. Veuillez en choisir un autre.' },
        { status: 400 }
      );
    }

    // 3. Resolve plan
    const selectedPlanSlug = plan_slug || 'pro';
    const planRows = await sql(
      `SELECT id FROM plans WHERE slug = $1 LIMIT 1`,
      [selectedPlanSlug]
    );
    const planId = planRows[0]?.id || null;

    // 4. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. 14-day trial period calculation
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // 6. Create Organization
    const orgRows = await sql(
      `
      INSERT INTO organizations (name, slug, plan_id, subscription_status, trial_ends_at, locale, currency)
      VALUES ($1, $2, $3, 'trialing', $4, 'fr', 'DZD')
      RETURNING *
    `,
      [org_name.trim(), generatedSlug, planId, trialEndsAt]
    );
    const organization = orgRows[0];

    // 7. Create Main Branch
    const branchRows = await sql(
      `
      INSERT INTO branches (organization_id, name, address, phone, is_main)
      VALUES ($1, 'Siège Principal / Atelier', $2, $3, true)
      RETURNING id
    `,
      [organization.id, body.address || null, phone || null]
    );
    const mainBranchId = branchRows[0]?.id || null;

    // 8. Create User
    const userRows = await sql(
      `
      INSERT INTO users (username, email, password_hash, active, is_platform_admin)
      VALUES ($1, $2, $3, true, false)
      RETURNING id, username, email
    `,
      [username.trim(), email?.trim() || null, passwordHash]
    );
    const user = userRows[0];

    // 9. Assign Owner Role in organization_members
    await sql(
      `
      INSERT INTO organization_members (organization_id, user_id, role, branch_id)
      VALUES ($1, $2, 'owner', $3)
    `,
      [organization.id, user.id, mainBranchId]
    );

    // 10. Audit Log
    await logAudit({
      organizationId: organization.id,
      userId: user.id,
      entityType: 'organizations',
      entityId: organization.id,
      action: 'create',
      metadata: {
        org_name,
        slug: generatedSlug,
        owner_name,
        plan: selectedPlanSlug,
        trial_ends_at: trialEndsAt,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Garage créé avec succès ! Votre essai gratuit de 14 jours est activé.',
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          subscription_status: organization.subscription_status,
          trial_ends_at: organization.trial_ends_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup failed:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du compte.' },
      { status: 500 }
    );
  }
}
