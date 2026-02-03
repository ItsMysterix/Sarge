import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  console.log('GET /api/projects - Request received');

  try {
    // Only try database if URL is configured
    if (!process.env.DATABASE_URL) {
      console.log('DATABASE_URL not configured, returning empty projects');
      return NextResponse.json({ projects: [] }, { status: 200 });
    }

    // Try to fetch from database with timeout
    const db = getDbPool();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout')), 3000)
    );

    // Query actual schema - just get basic project info
    const queryPromise = db.query(
      `SELECT 
        id,
        name,
        user_id,
        webhook_token,
        created_at,
        slug
       FROM projects
       ORDER BY created_at DESC`
    );

    const result = await Promise.race([queryPromise, timeoutPromise]) as any;

    // Transform to expected format
    const projects = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug || row.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      userId: row.user_id,
      webhookToken: row.webhook_token,
      createdAt: row.created_at,
      created_at: row.created_at,
      status: 'active',
      framework: null,
      description: '',
    }))
      // Filter out old test projects - only show projects created after Nov 10, 2025
      .filter((project: any) => {
        const createdDate = new Date(project.created_at);
        const cutoffDate = new Date('2025-11-10T00:00:00Z');
        return createdDate >= cutoffDate;
      });

    console.log(`Fetched ${projects.length} projects from database (filtered)`);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    // Return empty array if database is not configured yet
    return NextResponse.json({ projects: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'unknown';

    if (userId === 'unknown') {
      console.warn('POST /api/projects - No session found, using "unknown" as userId');
    }

    const body = await request.json();
    console.log('Request body:', body);
    console.log('User ID from session:', userId);

    // Create project object matching actual database schema
    const newProject = {
      id: crypto.randomUUID(),
      userId: userId,
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      webhookToken: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      status: 'active',
      framework: body.framework || null,
      description: body.description || '',
    };

    console.log('Created project object:', newProject);

    // If database is configured, try to insert using actual schema
    if (process.env.DATABASE_URL) {
      console.log('DATABASE_URL is configured, attempting database insert');
      const db = getDbPool();
      await db.query(
        `INSERT INTO projects (id, name, user_id, webhook_token, created_at, slug)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [newProject.id, newProject.name, newProject.userId, newProject.webhookToken, newProject.createdAt, newProject.slug]
      );
      console.log('Database insert successful');
    } else {
      console.log('DATABASE_URL not configured, skipping database insert');
    }

    console.log('Returning project with status 201');
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
