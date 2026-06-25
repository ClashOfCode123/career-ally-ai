# ⚙️ Automata

> An Event-Driven Microservices Platform for Automated Tech Hiring, Code Execution, and AI Mock Interviews.

Automata is a distributed system designed to simulate the entire technical recruitment lifecycle. It acts as an intelligent career assistant and testing ground for software engineers by combining a Remote Code Execution (RCE) engine, a real-time AI interviewer, a semantic ATS, and an automated job scraper into a single ecosystem. 

## ✨ Core Features

### 1. The Code Engine (Practice & Contests)
A highly isolated, high-performance coding platform.
* Users can participate in timed algorithmic contests and submit code.
* The system safely executes untrusted user code against hidden test cases using ephemeral, resource-limited **Docker** containers.
* Execution happens asynchronously via a **Redis** job queue, streaming real-time results and calculating an ongoing "skill rating" for the user.

### 2. The Resume Engine (Semantic ATS Matching)
A deep-learning approach to parsing candidate profiles.
* Users upload their PDF resumes to the platform.
* The system uses an LLM pipeline to extract structured data (skills, experience, education) and converts it into mathematical vector embeddings.
* These embeddings are stored in a **Vector Database (Pinecone)**, allowing the system to deeply understand a user's technical footprint beyond simple keyword matching.

### 3. The AI Interviewer (WebRTC Mock Interviews)
A hyper-personalized, ultra-low latency interview simulation.
* Users enter a live browser-based video room to speak with an AI voice agent.
* Powered by **WebRTC** and real-time Speech-to-Text pipelines, the AI conducts a technical interview without conversational lag.
* **Context-Aware:** The AI dynamically generates its questions based specifically on the user’s uploaded resume vector and the mistakes they made during their recent coding contests.

### 4. The Automated Job Hunter (Distributed Scraper)
A passive job-matching engine that works while the user is offline.
* A fleet of distributed **Puppeteer/Playwright** workers constantly scrapes career pages of target companies.
* Extracted Job Descriptions (JDs) are vectorized and cross-referenced against the user's resume vector using cosine similarity search.
* If the system detects a near-perfect match (e.g., >85% alignment between the resume and the job requirements), it automatically emails the user a direct application link.
