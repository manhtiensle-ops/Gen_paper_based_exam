import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const totalRes = await pool.query(`SELECT COUNT(*) FROM questions`);
    const noSolRes = await pool.query(`
      SELECT COUNT(*) FROM questions 
      WHERE (solution_latex IS NULL OR TRIM(solution_latex) = '')
        AND (sub_questions IS NULL OR sub_questions::text = '[]' OR sub_questions::text = 'null')
    `);
    const completedRes = await pool.query(`
      SELECT COUNT(*) FROM questions 
      WHERE (solution_latex IS NOT NULL AND TRIM(solution_latex) != '')
    `);

    return NextResponse.json({
      total: parseInt(totalRes.rows[0].count, 10),
      without_solution: parseInt(noSolRes.rows[0].count, 10),
      with_solution: parseInt(completedRes.rows[0].count, 10),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
