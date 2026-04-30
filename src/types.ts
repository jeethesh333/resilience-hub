export interface Challenge {
  id: string;
  name: string;
  duration: number;
  startDate: string;
  completedDays: number;
  notes: { [dayNumber: string]: Note };
}

export type Note = {
  content: string;
  vectorId: string;
};

export interface User {
  uid: string;
  name: string;
  challenges: Challenge[];
  dailyNotes: Record<string, string>;
}

export interface ChatAssistantProps {
  userData: User;
} 

