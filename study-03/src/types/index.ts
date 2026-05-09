export type Category = '한국사' | '과학' | '지리' | '예술과 문화';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: string;
  category: Category;
  difficulty: Difficulty;
  question: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface ScoreRecord {
  nickname: string;
  score: number;
  total: number;
  category: Category | '전체';
  timestamp: string;
  breakdown: Record<Category, number>;
}

export interface GameState {
  screen: 'home' | 'quiz' | 'feedback' | 'result' | 'leaderboard' | 'review';
  selectedCategory: Category | '전체';
  questions: Question[];
  currentIndex: number;
  selectedOption: number | null;
  score: number;
  answers: (number | null)[];
  nickname: string;
}
