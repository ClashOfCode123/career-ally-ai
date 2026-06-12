import MockInterview from '../models/MockInterview.js';
import { v4 as uuidv4 } from 'uuid';
import { sendInviteEmail } from '../services/emailService.js'; // Added import

export const bookInterview = async (req, res) => {
  try {
    const { timeSlot } = req.body; 
    const userId = req.user._id; // Extracted from your authMiddleware

    // 1. ATOMIC OPERATION: Find someone waiting for this exact time
    const match = await MockInterview.findOneAndUpdate(
      {
        timeSlot: new Date(timeSlot),
        status: 'waiting',
        userA: { $ne: userId } // Prevent matching with yourself
      },
      {
        $set: {
          status: 'matched',
          userB: userId,
          roomId: uuidv4() // Generate the secure room link instantly
        }
      },
      { new: true } // Return the updated document
    ).populate('userA', 'email username'); // Populate User A's info for the email step later

    if (match) {
      // --- BRANCH A: A peer was waiting! We have a match. ---
      console.log(`[MATCH FOUND] Room ID: ${match.roomId} created for User ${match.userA._id} and User ${userId}`);
      
      // 2. Generate the Daily.co Video Room
      try {
        const dailyRes = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.DAILY_API_KEY}`
          },
          body: JSON.stringify({
            properties: {
              exp: Math.floor(Date.now() / 1000) + 86400 // Room expires in 24 hours
            }
          })
        });
        
        const dailyData = await dailyRes.json();
        
        // Save the Daily video URL to the database document
        match.videoUrl = dailyData.url; 
        await match.save();
      } catch (dailyError) {
        console.error("Failed to create Daily.co room:", dailyError);
      }

      // 3. Fire the Email Invites (Don't await it, let it run asynchronously)
      sendInviteEmail(
        match.userA.email,
        req.user.email,
        match.timeSlot,
        match.roomId
      ).catch(err => console.error("Failed to send calendar invite:", err));
      
      return res.status(200).json({
        message: "Match successful! Check your email for the calendar invite.",
        roomId: match.roomId,
        interview: match
      });
    }

    // --- BRANCH B: Nobody is waiting. Create a new slot. ---
    const newInterview = await MockInterview.create({
      timeSlot: new Date(timeSlot),
      userA: userId,
      status: 'waiting'
    });

    console.log(`[WAITING ROOM] User ${userId} is waiting for a peer at ${timeSlot}`);

    return res.status(201).json({
      message: "Added to waiting room. We will notify you when a peer joins.",
      interview: newInterview
    });

  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ error: "Internal server error while booking interview." });
  }
};
// Add this below your existing bookInterview function
export const getInterviewRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Find the interview by its UUID
    const interview = await MockInterview.findOne({ roomId })
      .populate('userA', 'username')
      .populate('userB', 'username');

    if (!interview) {
      return res.status(404).json({ error: "Interview room not found or expired." });
    }

    res.status(200).json(interview);
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ error: "Failed to fetch room details." });
  }
};