import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET() {
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
  console.log('POST /api/projects - Request received');
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    // Create project object
    const newProject = {
      id: crypto.randomUUID(),
      userId: 'user_1',
      name: body.name,
      slug: body.slug,
      description: body.description || '',
      framework: body.framework || null,
      repositoryId: body.repositoryId || null,
      rootDirectory: body.rootDirectory || './',
      buildCommand: body.buildCommand || 'npm run build',
      outputDirectory: body.outputDirectory || '.next',
      installCommand: body.installCommand || 'npm install',
      devCommand: body.devCommand || 'npm run dev',
      autoDeploy: body.autoDeploy !== undefined ? body.autoDeploy : true,
      autoDeployBranch: body.autoDeployBranch || 'main',
      previewDeployments: body.previewDeployments !== undefined ? body.previewDeployments : true,
      status: 'active',
      deploymentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Created project object:', newProject);

    // If database is configured, try to insert
    if (process.env.DATABASE_URL) {
      console.log('DATABASE_URL is configured, attempting database insert');
      try {
        const db = getDbPool();
        await db.query(
          `INSERT INTO projects (
            id, user_id, name, slug, description, framework, repository_id,
            root_directory, build_command, output_directory, install_command,
            dev_command, auto_deploy, auto_deploy_branch, preview_deployments,
            status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
          [
            newProject.id, newProject.userId, newProject.name, newProject.slug,
            newProject.description, newProject.framework, newProject.repositoryId,
            newProject.rootDirectory, newProject.buildCommand, newProject.outputDirectory,
            newProject.installCommand, newProject.devCommand, newProject.autoDeploy,
            newProject.autoDeployBranch, newProject.previewDeployments, newProject.status,
            newProject.createdAt, newProject.updatedAt
          ]
        );
        console.log('Database insert successful');
      } catch (dbError) {
        console.error('Database insert failed, returning project anyway:', dbError);
      }
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
