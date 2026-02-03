import { db } from "../lib/db";

async function diagnose() {
    const table = process.argv[2] || "projects";
    const action = process.argv[3] || "schema";

    console.log(`\n--- DB Diagnosis: Target [${table}] Action [${action}] ---\n`);

    try {
        if (action === "schema") {
            const res = await db.query(
                `SELECT column_name, data_type, is_nullable, column_default 
         FROM information_schema.columns 
         WHERE table_name = $1 
         ORDER BY ordinal_position`,
                [table]
            );
            console.table(res.rows);
        } else if (action === "constraints") {
            const res = await db.query(
                `SELECT constraint_name, constraint_type 
         FROM information_schema.table_constraints 
         WHERE table_name = $1`,
                [table]
            );
            console.table(res.rows);
        } else if (action === "data") {
            const limit = process.argv[4] || "10";
            const res = await db.query(`SELECT * FROM ${table} LIMIT ${limit}`);
            console.table(res.rows);
        } else if (action === "tables") {
            const res = await db.query(
                `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
            );
            console.table(res.rows);
        } else {
            console.error("Unknown action. Available: schema, constraints, data, tables");
        }
    } catch (err) {
        console.error("Diagnosis failed:", err);
    } finally {
        await db.end();
    }
}

diagnose();
