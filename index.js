import 'dotenv/config';
import express from 'express';
import { connectDB } from './src/config/db.js';


import { User } from './src/models/User.js';
import { Problem } from './src/models/Problem.js';
import { Submission } from './src/models/Submission.js';

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());


connectDB();


app.get('/health', (req, res) => {
  res.json({ status: "Online", message: "Automata RCE Engine is ready! " });
});


app.post('/submit', async (req, res) => {
  try {
    const { userId, problemId, language, code } = req.body;

    
    const submission = await Submission.create({
      userId,
      problemId,
      language,
      code,
      status: 'Pending'
    });

    //Later we will insert in RabbitMq

    res.status(201).json({ 
        message: "Submission received!", 
        submissionId: submission._id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
