"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Users, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizGroup } from "@/lib/evaluation-types";

// Predefined colors for groups
const GROUP_COLORS = [
  { name: "Blue", value: "#3B82F6", bg: "bg-blue-500" },
  { name: "Green", value: "#22C55E", bg: "bg-green-500" },
  { name: "Purple", value: "#A855F7", bg: "bg-purple-500" },
  { name: "Orange", value: "#F97316", bg: "bg-orange-500" },
  { name: "Pink", value: "#EC4899", bg: "bg-pink-500" },
  { name: "Cyan", value: "#06B6D4", bg: "bg-cyan-500" },
];

// Mock students for assignment (will be replaced with real data)
const MOCK_STUDENTS = [
  { id: "s1", name: "Ahmad Rizki", avatar: "AR" },
  { id: "s2", name: "Budi Santoso", avatar: "BS" },
  { id: "s3", name: "Citra Dewi", avatar: "CD" },
  { id: "s4", name: "Dian Pratama", avatar: "DP" },
  { id: "s5", name: "Eka Putri", avatar: "EP" },
  { id: "s6", name: "Fajar Nugroho", avatar: "FN" },
  { id: "s7", name: "Gita Maharani", avatar: "GM" },
  { id: "s8", name: "Hendra Wijaya", avatar: "HW" },
  { id: "s9", name: "Indah Sari", avatar: "IS" },
  { id: "s10", name: "Joko Widodo", avatar: "JW" },
];

interface GroupManagerProps {
  groups: QuizGroup[];
  onChange: (groups: QuizGroup[]) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function GroupManager({ groups, onChange, enabled, onToggle }: GroupManagerProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const addGroup = () => {
    const colorIndex = groups.length % GROUP_COLORS.length;
    const newGroup: QuizGroup = {
      id: `group_${Date.now()}`,
      name: `Kelompok ${String.fromCharCode(65 + groups.length)}`, // A, B, C...
      color: GROUP_COLORS[colorIndex].value,
      memberIds: [],
    };
    onChange([...groups, newGroup]);
    setExpandedGroup(newGroup.id);
  };

  const updateGroup = (id: string, updates: Partial<QuizGroup>) => {
    onChange(groups.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGroup = (id: string) => {
    onChange(groups.filter(g => g.id !== id));
  };

  const toggleStudent = (groupId: string, studentId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const isInGroup = group.memberIds.includes(studentId);
    const newMemberIds = isInGroup
      ? group.memberIds.filter(id => id !== studentId)
      : [...group.memberIds, studentId];
    
    updateGroup(groupId, { memberIds: newMemberIds });
  };

  // Get students not in any group
  const getUnassignedStudents = () => {
    const assignedIds = new Set(groups.flatMap(g => g.memberIds));
    return MOCK_STUDENTS.filter(s => !assignedIds.has(s.id));
  };

  // Get students in a specific group
  const getGroupStudents = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];
    return MOCK_STUDENTS.filter(s => group.memberIds.includes(s.id));
  };

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-500" />
          <div>
            <h4 className="font-medium text-zinc-900 dark:text-white">Enable Group Mode</h4>
            <p className="text-sm text-zinc-500">Mahasiswa hanya melihat leaderboard sesama kelompok</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            enabled ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              enabled ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      {enabled && (
        <>
          {/* Groups List */}
          <div className="space-y-3">
            {groups.map((group, index) => (
              <div
                key={group.id}
                className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
              >
                {/* Group Header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium bg-transparent border-none focus:ring-0 text-zinc-900 dark:text-white"
                    />
                    <span className="text-sm text-zinc-500">
                      ({group.memberIds.length} anggota)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGroup(group.id);
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Content - Student Assignment */}
                {expandedGroup === group.id && (
                  <div className="border-t border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50 dark:bg-zinc-800/30">
                    <p className="text-sm text-zinc-500 mb-3">
                      Klik mahasiswa untuk menambah/menghapus dari kelompok
                    </p>
                    
                    {/* Students in this group */}
                    {getGroupStudents(group.id).length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                          Anggota Kelompok:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {getGroupStudents(group.id).map(student => (
                            <button
                              key={student.id}
                              type="button"
                              onClick={() => toggleStudent(group.id, student.id)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                              style={{ backgroundColor: group.color }}
                            >
                              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                                {student.avatar}
                              </span>
                              {student.name}
                              <span className="text-white/80">×</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unassigned students */}
                    {getUnassignedStudents().length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                          Belum Ada Kelompok:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {getUnassignedStudents().map(student => (
                            <button
                              key={student.id}
                              type="button"
                              onClick={() => toggleStudent(group.id, student.id)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                            >
                              <span className="w-5 h-5 rounded-full bg-zinc-400 dark:bg-zinc-500 flex items-center justify-center text-xs text-white">
                                {student.avatar}
                              </span>
                              {student.name}
                              <UserPlus className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Group Button */}
          <Button
            type="button"
            variant="outline"
            onClick={addGroup}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kelompok
          </Button>

          {/* Summary */}
          {groups.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                📊 Ringkasan Kelompok
              </p>
              <div className="flex flex-wrap gap-3 text-blue-600 dark:text-blue-400">
                {groups.map(g => (
                  <span key={g.id} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                    {g.name}: {g.memberIds.length} orang
                  </span>
                ))}
              </div>
              <p className="text-xs text-blue-500 mt-2">
                Belum diassign: {getUnassignedStudents().length} mahasiswa
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
