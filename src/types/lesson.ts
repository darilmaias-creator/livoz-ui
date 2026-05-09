import type { ChildLevel } from "@/types/child";

export type LessonType =
  | "VOCABULARY"
  | "LISTENING"
  | "SPEAKING"
  | "READING"
  | "CHAT"
  | "PRONUNCIATION"
  | "STORY"
  | "REVIEW";

export type Lesson = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  level: ChildLevel;
  type: LessonType;
  contentJson?: unknown;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
