// Check existing data in database
try { var dotenv = require('dotenv'); dotenv.config() } catch {}
const neon = require('@neondatabase/serverless').neon;
const sql = neon(process.env.DATABASE_URL);

async function checkExistingData() {
  console.log('📊 Checking existing data in database...\n');
  
  try {
    const users = await sql`SELECT id, email, name FROM users LIMIT 5`;
    console.log(`Users: ${users.length}`);
    if (users.length > 0) console.table(users);
    
    const repos = await sql`SELECT id, owner, repo, full_name, is_primary FROM repositories LIMIT 5`;
    console.log(`\nRepositories: ${repos.length}`);
    if (repos.length > 0) console.table(repos);
    
    const projects = await sql`SELECT id, name, slug, repository_id FROM projects LIMIT 5`;
    console.log(`\nProjects: ${projects.length}`);
    if (projects.length > 0) console.table(projects);
    
    const stacks = await sql`SELECT id, name, status, user_id FROM stacks LIMIT 5`;
    console.log(`\nStacks: ${stacks.length}`);
    if (stacks.length > 0) console.table(stacks);
    
    const logs = await sql`SELECT COUNT(*) as count FROM logs`;
    console.log(`\nLogs: ${logs[0].count} entries`);
    
    const metrics = await sql`SELECT COUNT(*) as count FROM metrics`;
    console.log(`Metrics: ${metrics[0].count} entries`);
    
    const deployments = await sql`SELECT COUNT(*) as count FROM deployments`;
    console.log(`Deployments: ${deployments[0].count} entries`);
    
    console.log('\n✅ Your database already has data!');
    console.log('The seed scripts added more sample data on top of existing data.');
    
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

checkExistingData();
