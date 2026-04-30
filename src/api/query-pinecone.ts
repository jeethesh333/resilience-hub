import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');

export async function queryPinecone(userId: string, query: string) {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
  
  // Get embeddings for the query using Gemini
  const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await embeddingModel.embedContent(query);
  const embedding = Array.from(result.embedding.values);

  // Query Pinecone
  const queryResponse = await index.query({
    vector: embedding,
    filter: { userId },
    topK: 5,
    includeMetadata: true
  });

  return queryResponse.matches;
} 