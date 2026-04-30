import { GoogleGenerativeAI } from '@google/generative-ai';
import { Note } from '../types';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

async function getEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await model.embedContent(text);
  const embedding = result.embedding;
  return embedding.values;
}

// Helper to build vectorId (if needed for legacy support)
function buildVectorId(userId: string, type: string, challengeId?: string, dayNumber?: number) {
  if (type === 'reflection') {
    return `${userId}-reflection-${dayNumber}`;
  } else if (type === 'challenge') {
    return `${userId}-challenge-${challengeId}`;
  } else {
    return `${userId}-note-${challengeId}-${Date.now()}`;
  }
}

// Update the type definition to include 'prefix'
type DeleteFromPineconeParams = {
  userId?: string;
  type?: "challenge" | "note" | "reflection";
  challengeId?: string;
  dayNumber?: number;
  vectorId?: string;
  prefix?: string;
};

// Upsert to Pinecone and return vectorId
export const upsertToPinecone = async (data: {
  userId: string;
  type: 'challenge' | 'note' | 'reflection';
  content: string;
  metadata: Record<string, any>;
}) => {
  // Generate embedding from content
  // (Assume embedding is handled elsewhere if using pinecone.ts for upserts)
  const payload = {
    userId: data.userId,
    vector: await getEmbedding(data.content), // If you use Gemini here
    metadata: {
      ...data.metadata,
      type: data.type,
      content: data.content,
      dayNumber: data.metadata.dayNumber,
      challengeId: data.metadata.challengeId,
    }
  };

  const response = await fetch('/api/upsert-pinecone', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to upsert data: ${errorData}`);
  }

  // Return the vectorId so it can be stored in Firestore
  return await response.json();
};

// Delete from Pinecone using vectorId or prefix
export const deleteFromPinecone = async (params: DeleteFromPineconeParams) => {
  let requestBody: any = {};
  if (params.vectorId) {
    requestBody.vectorId = params.vectorId;
  } else if (params.prefix) {
    requestBody.prefix = params.prefix;
  } else if (params.userId && params.type && params.challengeId) {
    // Fallback for legacy support
    requestBody.prefix = `${params.userId}-${params.type}-${params.challengeId}`;
  } else {
    throw new Error('Must provide vectorId or prefix for deletion');
  }

  const response = await fetch('/api/delete-pinecone', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to delete data: ${errorData}`);
  }

  return await response.json();
};

// If you have updatePineconeNote, make sure it uses vectorId for deletion
export const updatePineconeNote = async (data: {
  userId: string;
  type: 'challenge' | 'note' | 'reflection';
  id: string;
  content: string;
  metadata: Record<string, any>;
  oldVectorId?: string;
}) => {
  try {
    // First delete the old vector using vectorId
    if (data.oldVectorId) {
      await deleteFromPinecone({ vectorId: data.oldVectorId });
    }

    // Then create new vector with updated content
    const upsertResponse = await upsertToPinecone({
      userId: data.userId,
      type: data.type,
      content: data.content,
      metadata: data.metadata
    });

    return { status: 'success', message: 'Note updated in Pinecone', vectorId: upsertResponse.vectorId };
  } catch (error) {
    console.error('Error updating note in Pinecone:', error);
    throw error;
  }
};

// If you use getEmbedding here, import or define it as in pinecone.ts