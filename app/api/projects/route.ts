import { NextResponse } from 'next/server';

// Mock projects data - will be replaced with database queries
export async function GET() {
  try {
    const mockProjects = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'user_1',
        name: 'My Next.js App',
        slug: 'my-nextjs-app',
        description: 'A modern web application built with Next.js',
        framework: 'next.js',
        repositoryId: 1,
        rootDirectory: './',
        buildCommand: 'npm run build',
        outputDirectory: '.next',
        installCommand: 'npm install',
        devCommand: 'npm run dev',
        autoDeploy: true,
        autoDeployBranch: 'main',
        previewDeployments: true,
        aiDetectedFramework: 'next.js',
        aiDetectedPorts: [3000],
        aiDetectedTools: ['node', 'npm'],
        aiAnalysisSummary: 'Detected Next.js 14 application with App Router',
        aiAnalyzedAt: new Date().toISOString(),
        status: 'active',
        lastDeployedAt: new Date().toISOString(),
        deploymentCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json({ projects: mockProjects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ projects: [] }, { status: 200 }); // Graceful fallback
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
