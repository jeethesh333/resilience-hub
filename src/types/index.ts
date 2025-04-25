export interface Challenge {
  id: string;
  name: string;
  duration: number;
  startDate: string;
  completedDays: number;
  notes: { [key: number]: string };
}

export interface User {
  name: string;
  challenges: Challenge[];
  dailyNotes: { [date: string]: string };
} 