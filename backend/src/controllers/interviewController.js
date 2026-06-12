import MockInterview from '../models/MockInterview.js';
import { User } from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import { sendInviteEmail } from '../services/emailService.js';

export const bookInterview = async (req, res) => {
  try {
    const { timeSlot } = req.body;
    const userId = req.user._id;

    if (!timeSlot) {
      return res.status(400).json({ error: 'timeSlot is required.' });
    }

    const selectedTime = new Date(timeSlot);

    if (Number.isNaN(selectedTime.getTime())) {
      return res.status(400).json({ error: 'Invalid timeSlot format.' });
    }

    if (selectedTime <= new Date()) {
      return res.status(400).json({
        error: 'You cannot schedule an interview in the past.',
      });
    }

    const existingWaitingInterview = await MockInterview.findOne({
      userA: userId,
      timeSlot: selectedTime,
      status: 'waiting',
    });

    if (existingWaitingInterview) {
      return res.status(409).json({
        message: 'You are already waiting for a peer at this time.',
        interview: existingWaitingInterview,
      });
    }

    const match = await MockInterview.findOneAndUpdate(
      {
        timeSlot: selectedTime,
        status: 'waiting',
        userA: { $ne: userId },
      },
      {
        $set: {
          status: 'matched',
          userB: userId,
          roomId: uuidv4(),
        },
      },
      { new: true }
    ).populate('userA', 'email username');

    if (match) {
      console.log(
        `[MATCH FOUND] Room ID: ${match.roomId} created for User ${match.userA._id} and User ${userId}`
      );

      try {
        const dailyRes = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          },
          body: JSON.stringify({
            properties: {
              exp: Math.floor(Date.now() / 1000) + 86400,
            },
          }),
        });

        const dailyData = await dailyRes.json();

        if (dailyData?.url) {
          match.videoUrl = dailyData.url;
          await match.save();
        } else {
          console.error('Daily.co room creation failed:', dailyData);
        }
      } catch (dailyError) {
        console.error('Failed to create Daily.co room:', dailyError);
      }

      await User.findByIdAndUpdate(match.userA._id, {
        $push: {
          notifications: {
            $each: [
              {
                type: 'peer_matched',
                message: 'Peer found for your scheduled interview.',
                interviewTime: match.timeSlot,
                read: false,
              },
            ],
            $slice: -50,
          },
        },
      });

      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            $each: [
              {
                type: 'peer_matched',
                message: 'Peer found for your scheduled interview.',
                interviewTime: match.timeSlot,
                read: false,
              },
            ],
            $slice: -50,
          },
        },
      });

      sendInviteEmail(
        match.userA.email,
        req.user.email,
        match.timeSlot,
        match.roomId
      ).catch((err) => console.error('Failed to send calendar invite:', err));

      return res.status(200).json({
        message: 'Match successful! Check your email for the calendar invite.',
        roomId: match.roomId,
        interview: match,
      });
    }

    const newInterview = await MockInterview.create({
      timeSlot: selectedTime,
      userA: userId,
      status: 'waiting',
    });

    console.log(
      `[WAITING ROOM] User ${userId} is waiting for a peer at ${selectedTime.toISOString()}`
    );

    return res.status(201).json({
      message: 'Added to waiting room. We will notify you when a peer joins.',
      interview: newInterview,
    });
  } catch (error) {
    console.error('Booking Error:', error);
    res.status(500).json({
      error: 'Internal server error while booking interview.',
    });
  }
};

export const getInterviewRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const interview = await MockInterview.findOne({ roomId })
      .populate('userA', 'username')
      .populate('userB', 'username');

    if (!interview) {
      return res.status(404).json({
        error: 'Interview room not found or expired.',
      });
    }

    res.status(200).json(interview);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({
      error: 'Failed to fetch room details.',
    });
  }
};

export const getInterviewNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const notifications = [...user.notifications].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Notification fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications.',
    });
  }
};

export const markInterviewNotificationsRead = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user._id },
      {
        $set: {
          'notifications.$[notification].read': true,
        },
      },
      {
        arrayFilters: [{ 'notification.read': false }],
      }
    );

    res.status(200).json({
      message: 'Notifications marked as read.',
    });
  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({
      error: 'Failed to update notifications.',
    });
  }
};