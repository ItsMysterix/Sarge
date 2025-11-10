import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET() {
  try {
    // Try to fetch from database with timeout
    const db = getDbPool();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 3000)
    );
    
    const queryPromise = db.query(
      `SELECT 
        p.*,
        COUNT(DISTINCT d.id) as deployment_count,
        MAX(d.created_at) as last_deployed_at
       FROM projects p
       LEFT JOIN deployments d ON d.project_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      ['user_1'] // TODO: Get from auth context
    );
    
    const result = await Promise.race([queryPromise, timeoutPromise]) as any;
    return NextResponse.json({ projects: result.rows });
  } catch (error) {
    console.error('Error fetching projects:', error);
    // Return empty array if database is not configured yet
    return NextResponse.json({ projects: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // TODO: Insert into database
    const newProject = {
      id: crypto.randomUUID(),
      userId: 'user_1',
      ...body,
      status: 'active',
      deploymentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
