import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// POST /api/knowledgebase/solutions/[id]/vote - Toggle upvote on a diagnostic solution
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: solutionId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId, organizationId } = session.user;

  try {
    const existingVote = await sql(
      `
      SELECT id FROM solution_votes 
      WHERE solution_id = $1 AND organization_id = $2 
      LIMIT 1
    `,
      [solutionId, organizationId]
    );

    let hasVoted = false;

    if (existingVote.length > 0) {
      // Remove vote
      await sql(`DELETE FROM solution_votes WHERE id = $1`, [existingVote[0].id]);
      await sql(
        `
        UPDATE mechanical_solutions 
        SET upvotes_count = GREATEST(0, upvotes_count - 1),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
        [solutionId]
      );
      hasVoted = false;
    } else {
      // Add upvote
      await sql(
        `
        INSERT INTO solution_votes (solution_id, organization_id, user_id, vote_type)
        VALUES ($1, $2, $3, 'upvote')
      `,
        [solutionId, organizationId, userId]
      );
      await sql(
        `
        UPDATE mechanical_solutions 
        SET upvotes_count = upvotes_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
        [solutionId]
      );
      hasVoted = true;
    }

    const updatedRows = await sql(
      `SELECT upvotes_count FROM mechanical_solutions WHERE id = $1 LIMIT 1`,
      [solutionId]
    );

    return NextResponse.json({
      has_voted: hasVoted,
      upvotes_count: updatedRows[0]?.upvotes_count || 0,
    });
  } catch (error: any) {
    console.error('Failed to vote on mechanical solution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
