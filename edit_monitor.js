const fs = require('fs');

function editFile(path, replacements) {
  let content = fs.readFileSync(path, 'utf8');
  replacements.forEach(r => {
    content = content.replace(r.pattern, r.replacement);
  });
  fs.writeFileSync(path, content);
}

// 1. Edit actions/evaluations.ts to add restartQuestions
const actionsPath = 'c:/Ngoding/ITSDojo/actions/evaluations.ts';
let actionsContent = fs.readFileSync(actionsPath, 'utf8');
if (!actionsContent.includes('export async function restartQuestions')) {
  const nextQuestionRegex = /(export async function nextQuestion[\s\S]*?\n})/;
  actionsContent = actionsContent.replace(nextQuestionRegex, `$1\n\nexport async function restartQuestions(evaluationId: string) {\n  try {\n    await db.update(evaluations).set({\n      currentQuestionIndex: 0,\n      questionStartedAt: new Date(),\n      isPaused: false,\n      pausedAt: null\n    }).where(eq(evaluations.id, evaluationId));\n    return { success: true };\n  } catch (error) {\n    console.error("Failed to restartQuestions:", error);\n    return { success: false };\n  }\n}`);
  fs.writeFileSync(actionsPath, actionsContent);
}

// 2. Edit monitor page
const monitorPath = 'c:/Ngoding/ITSDojo/app/(admin)/admin/evaluations/[id]/monitor/page.tsx';
editFile(monitorPath, [
  {
    pattern: /import { getEvaluationById, getLiveEvaluationProgress, startEvaluationSession, pauseEvaluationSession, deleteStudentProgress, updateEvaluation, nextQuestion, pauseQuestion, resumeQuestion, getEvaluationSessionStatus } from "@\/actions\/evaluations";/,
    replacement: 'import { getEvaluationById, getLiveEvaluationProgress, startEvaluationSession, pauseEvaluationSession, deleteStudentProgress, updateEvaluation, nextQuestion, pauseQuestion, resumeQuestion, getEvaluationSessionStatus, restartQuestions } from "@/actions/evaluations";'
  },
  {
    pattern: /const \[autoNext, setAutoNext\] = useState<boolean>\(false\);/,
    replacement: 'const [autoNext, setAutoNext] = useState<boolean>(false);\n  const [autoRepeat, setAutoRepeat] = useState<boolean>(false);'
  },
  {
    pattern: /if \(rem === 0 && autoNext && !isCallingNext\.current && currentQuestionIndex < \(evaluation\.questions\?\.length \|\| 0\) - 1\) \{\n\s*isCallingNext\.current = true;\n\s*const res = await nextQuestion\(evaluation\.id\);\n\s*if \(res\.success\) \{\n\s*toast\.success\("Otomatis pindah ke soal berikutnya!"\);\n\s*\}\n\s*setTimeout\(\(\) => \{\n\s*isCallingNext\.current = false;\n\s*\}, 2000\);\n\s*\}/,
    replacement: `if (rem === 0 && !isCallingNext.current) {
        if (autoNext && currentQuestionIndex < (evaluation.questions?.length || 0) - 1) {
          isCallingNext.current = true;
          const res = await nextQuestion(evaluation.id);
          if (res.success) toast.success("Otomatis pindah ke soal berikutnya!");
          setTimeout(() => { isCallingNext.current = false; }, 2000);
        } else if (autoRepeat && currentQuestionIndex >= (evaluation.questions?.length || 0) - 1) {
          isCallingNext.current = true;
          const res = await restartQuestions(evaluation.id);
          if (res.success) toast.success("Otomatis mengulang dari soal pertama!");
          setTimeout(() => { isCallingNext.current = false; }, 2000);
        }
      }`
  },
  {
    pattern: /\[evaluation, currentQuestionIndex, questionStartedAt, isPaused, sessionStatus, autoNext\]/,
    replacement: '[evaluation, currentQuestionIndex, questionStartedAt, isPaused, sessionStatus, autoNext, autoRepeat]'
  },
  {
    pattern: /<div className="flex items-center gap-2 ml-2">\n\s*<div\s*className=\{cn\(\n\s*"w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300",\s*autoNext \? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-700"\n\s*\)\}\n\s*onClick=\{\(\) => setAutoNext\(!autoNext\)\}\n\s*>\n\s*<div\s*className=\{cn\(\n\s*"bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out",\s*autoNext \? "translate-x-6" : ""\n\s*\)\}\n\s*\/>\n\s*<\/div>\n\s*<span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Auto-Next<\/span>\n\s*<\/div>/,
    replacement: `<div className="flex items-center gap-2 ml-2">
                  <div 
                    className={cn(
                      "w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300", 
                      autoNext ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-700"
                    )}
                    onClick={() => setAutoNext(!autoNext)}
                  >
                    <div 
                      className={cn(
                        "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out", 
                        autoNext ? "translate-x-6" : ""
                      )}
                    />
                  </div>
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Auto-Next</span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <div 
                    className={cn(
                      "w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300", 
                      autoRepeat ? "bg-pink-500" : "bg-zinc-300 dark:bg-zinc-700"
                    )}
                    onClick={() => setAutoRepeat(!autoRepeat)}
                  >
                    <div 
                      className={cn(
                        "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out", 
                        autoRepeat ? "translate-x-6" : ""
                      )}
                    />
                  </div>
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Auto-Repeat</span>
                </div>`
  },
  {
    pattern: /<div className="text-2xl font-bold text-purple-600">\n\s*\{Math\.round\(accuracyPercentage\)\\}%\n\s*<\/div>/,
    replacement: ''
  }
]);
