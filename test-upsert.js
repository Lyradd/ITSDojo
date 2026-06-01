require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
async function run() {
  try {
    const data = {
      evaluationId: 'eval-1779770614202',
      studentId: null,
      studentName: 'Danis',
      currentQuestion: 0,
      totalQuestions: 10,
      score: 0,
      status: 'active',
      timeElapsed: 0,
    };
    
    await sql`
      INSERT INTO evaluation_progress 
      (evaluation_id, student_id, student_name, current_question, total_questions, score, status, time_elapsed, updated_at) 
      VALUES (${data.evaluationId}, ${data.studentId}, ${data.studentName}, ${data.currentQuestion}, ${data.totalQuestions}, ${data.score}, ${data.status}, ${data.timeElapsed}, NOW())
      ON CONFLICT (evaluation_id, student_id) DO UPDATE SET 
        student_name = EXCLUDED.student_name,
        current_question = EXCLUDED.current_question,
        score = EXCLUDED.score,
        status = EXCLUDED.status,
        time_elapsed = EXCLUDED.time_elapsed,
        updated_at = NOW();
    `;
    console.log("Upsert success");
  } catch (err) {
    console.error("UPSERT ERROR:", err);
  }
}
run();
