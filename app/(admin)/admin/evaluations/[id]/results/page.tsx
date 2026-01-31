"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { SAMPLE_EVALUATIONS } from "@/lib/evaluation-data";
import { MOCK_EVALUATION_RESULTS } from "@/lib/admin-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Trophy,
  Target,
  Clock,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DetailedResultsPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'question' | 'student'>('overview');

  const evaluation = SAMPLE_EVALUATIONS.find((e) => e.id === evaluationId);
  const results = MOCK_EVALUATION_RESULTS[evaluationId] || [];

  if (!evaluation) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">Evaluation not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const avgScore = Math.round(
    results.reduce((sum, r) => sum + r.score, 0) / results.length || 0
  );

  const passRate = results.filter((r) => r.score >= 60).length / results.length * 100 || 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                Results: {evaluation.title}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Detailed analysis and student answers
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button variant="outline" className="gap-2">
                <FileText className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={viewMode === 'overview' ? 'default' : 'outline'}
            onClick={() => setViewMode('overview')}
          >
            Overview
          </Button>
          <Button
            variant={viewMode === 'question' ? 'default' : 'outline'}
            onClick={() => setViewMode('question')}
          >
            By Question
          </Button>
          <Button
            variant={viewMode === 'student' ? 'default' : 'outline'}
            onClick={() => setViewMode('student')}
          >
            By Student
          </Button>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'overview' && (
          <OverviewView
            evaluation={evaluation}
            results={results}
            avgScore={avgScore}
            passRate={passRate}
          />
        )}

        {viewMode === 'question' && (
          <QuestionView evaluation={evaluation} results={results} />
        )}

        {viewMode === 'student' && (
          <StudentView
            evaluation={evaluation}
            results={results}
            selectedStudent={selectedStudent}
            setSelectedStudent={setSelectedStudent}
          />
        )}
      </div>
    </div>
  );
}

function OverviewView({ evaluation, results, avgScore, passRate }: any) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{results.length}</div>
              <div className="text-sm text-zinc-500">Total Submissions</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{avgScore}%</div>
              <div className="text-sm text-zinc-500">Average Score</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(passRate)}%
              </div>
              <div className="text-sm text-zinc-500">Pass Rate</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-lg">
              <Trophy className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.max(...results.map((r: any) => r.score), 0)}%
              </div>
              <div className="text-sm text-zinc-500">Highest Score</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Score Distribution</h3>
        <div className="space-y-2">
          {[
            { range: '90-100', count: results.filter((r: any) => r.score >= 90).length, color: 'bg-green-600' },
            { range: '80-89', count: results.filter((r: any) => r.score >= 80 && r.score < 90).length, color: 'bg-blue-600' },
            { range: '70-79', count: results.filter((r: any) => r.score >= 70 && r.score < 80).length, color: 'bg-yellow-600' },
            { range: '60-69', count: results.filter((r: any) => r.score >= 60 && r.score < 70).length, color: 'bg-orange-600' },
            { range: '0-59', count: results.filter((r: any) => r.score < 60).length, color: 'bg-red-600' },
          ].map((item) => (
            <div key={item.range} className="flex items-center gap-3">
              <div className="w-20 text-sm font-semibold">{item.range}%</div>
              <div className="flex-1 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg overflow-hidden">
                <div
                  className={cn("h-full", item.color)}
                  style={{ width: `${(item.count / results.length) * 100}%` }}
                />
              </div>
              <div className="w-12 text-right text-sm text-zinc-600">{item.count}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function QuestionView({ evaluation, results }: any) {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Question-by-Question Analysis</h3>
        <div className="space-y-6">
          {evaluation.questions.map((question: any, index: number) => {
            // Calculate success rate for this question
            // In real app: get from submissions data
            const successRate = 70 + Math.random() * 25; // Mock data

            return (
              <div key={question.id} className="p-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-900 dark:text-white mb-2">
                      {question.question}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <span>{question.points} points</span>
                      <span>•</span>
                      <span className="uppercase">{question.bloomLevel}</span>
                      <span>•</span>
                      <span>{question.type.replace('_', ' ')}</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold">Success Rate</span>
                        <span className="text-sm font-bold">{Math.round(successRate)}%</span>
                      </div>
                      <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full",
                            successRate >= 70 ? "bg-green-600" : successRate >= 50 ? "bg-yellow-600" : "bg-red-600"
                          )}
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function StudentView({ evaluation, results, selectedStudent, setSelectedStudent }: any) {
  const student = selectedStudent
    ? results.find((r: any) => r.userId === selectedStudent)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Student List */}
      <Card className="p-6 lg:col-span-1">
        <h3 className="text-lg font-bold mb-4">Students ({results.length})</h3>
        <div className="space-y-2">
          {results.map((result: any) => (
            <button
              key={result.userId}
              onClick={() => setSelectedStudent(result.userId)}
              className={cn(
                "w-full p-3 rounded-lg text-left transition-all",
                selectedStudent === result.userId
                  ? "bg-blue-100 dark:bg-blue-950 border-2 border-blue-600"
                  : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
            >
              <div className="font-semibold text-zinc-900 dark:text-white">
                {result.userName}
              </div>
              <div className="text-sm text-zinc-500">Score: {result.score}%</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Student Details */}
      <Card className="p-6 lg:col-span-2">
        {student ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">{student.userName}</h3>
                <p className="text-zinc-500">Submitted: {new Date(student.submittedAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">{student.score}%</div>
                <div className="text-sm text-zinc-500">Final Score</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Answers:</h4>
              {evaluation.questions.map((question: any, index: number) => (
                <div key={question.id} className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold mb-2">{question.question}</p>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {/* Mock answer display */}
                        <div className="flex items-center gap-2 mb-1">
                          {Math.random() > 0.3 ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="font-medium">
                            {question.type === 'multiple_choice' && question.options?.[0]?.text}
                            {question.type === 'true_false' && "True"}
                            {question.type === 'essay' && "Essay answer here..."}
                            {question.type === 'short_answer' && "Short text answer"}
                          </span>
                        </div>
                        <div className="text-xs">
                          Points: {Math.random() > 0.3 ? question.points : 0}/{question.points}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500">
            Select a student to view their answers
          </div>
        )}
      </Card>
    </div>
  );
}
