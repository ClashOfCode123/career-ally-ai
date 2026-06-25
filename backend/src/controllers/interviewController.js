import MockInterview from '../models/MockInterview.js';
import { v4 as uuidv4 } from 'uuid';
import { sendInviteEmail } from '../services/emailService.js';

export const bookInterview = async (req, res) => {
  try {
    const { timeSlot } = req.body; 
    const userId = req.user._id;

    const match = await MockInterview.findOneAndUpdate(
      {
        timeSlot: new Date(timeSlot),
        status: 'waiting',
        userA: { $ne: userId } 
      },
      {
        $set: {
          status: 'matched',
          userB: userId,
          roomId: uuidv4() 
        }
      },
      { new: true }
    ).populate('userA', 'email username');

    if (match) {
      console.log(`[MATCH FOUND] Room ID: ${match.roomId} created for User ${match.userA._id} and User ${userId}`);
      
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

export const getInterviewRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    
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