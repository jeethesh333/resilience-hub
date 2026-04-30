import { Challenge, User, Note } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Function to get embeddings from Gemini
async function getEmbedding(text: string) {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
  const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await embeddingModel.embedContent(text);
  return Array.from(result.embedding.values);
}

// Function to upsert challenge data
export async function upsertChallengeData(userId: string, challenge: Challenge) {
  try {
    console.log('Starting upsert for challenge:', challenge.name);
    const vector = await getEmbedding(
      `Challenge: ${challenge.name}. Progress: ${challenge.completedDays}/${challenge.duration} days.`
    );
    console.log('Got embedding, sending to server...');

    const response = await fetch('/api/upsert-pinecone', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        userId,
        vector,
        metadata: {
          type: 'challenge',
          challengeId: challenge.id,
          content: `Challenge: ${challenge.name}. Progress: ${challenge.completedDays}/${challenge.duration} days.`,
          date: new Date().toISOString()
        }
      })
    });

    const responseText = await response.text();
    console.log('Raw server response:', responseText);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    console.log('Parsed server response:', result);
    return result;
  } catch (error) {
    console.error('Detailed error in upsertChallengeData:', error);
    throw error;
  }
}

// Function to upsert note data
export async function upsertNoteData(
  userId: string,
  challengeId: string,
  dayNumber: number,
  note: string | Note // Accept both for migration safety
): Promise<{ vectorId: string }> {
  // If note is a Note object, use its content
  const noteContent = typeof note === 'string' ? note : note.content;

  const vector = await getEmbedding(noteContent);

  const response = await fetch('/api/upsert-pinecone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      vector,
      metadata: {
        type: 'note',
        challengeId,
        dayNumber,
        content: noteContent,
        date: new Date().toISOString()
      }
    })
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Server error: ${response.status} - ${responseText}`);
  }

  const result = JSON.parse(responseText);
  // Return the vectorId so it can be stored in Firestore
  return { vectorId: result.vectorId };
}

// Function to upsert daily reflection
export async function upsertDailyReflection(userId: string, date: string, reflection: string) {
  const vector = await getEmbedding(reflection);

  await fetch('/api/upsert-pinecone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      vector,
      metadata: {
        type: 'reflection',
        date,
        content: reflection,
        dateCreated: new Date().toISOString()
      }
    })
  });
} 