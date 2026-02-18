export async function logProjectActivity(
    db: any,
    projectId: string,
    userId: string,
    action: string,
    details: any = {}
) {
    try {
        await db.query(
            `INSERT INTO project_activity (project_id, user_id, action, details, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
            [projectId, userId, action, JSON.stringify(details)]
        );
    } catch (err) {
        console.error('[logProjectActivity] Error logging project activity:', err);
    }
}
