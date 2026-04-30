// import express from 'express';
// import { queryPinecone } from '../../src/api/query-pinecone';

// const router = express.Router();

// router.post('/api/query-pinecone', async (req, res) => {
//   try {
//     const { userId, query } = req.body;
//     const matches = await queryPinecone(userId, query);
//     res.json({ matches });
//   } catch (error) {
//     console.error('Error querying Pinecone:', error);
//     res.status(500).json({ error: 'Failed to query Pinecone' });
//   }
// });

// export default router; 