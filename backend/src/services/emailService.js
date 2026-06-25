import nodemailer from 'nodemailer';

// 1. Configure the transport (Use Gmail App Passwords in production)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // e.g., your_email@gmail.com
    pass: process.env.EMAIL_PASS  // e.g., your 16-character App Password
  }
});

// Helper: Convert JS Date to ICS format (YYYYMMDDTHHMMSSZ)
const formatDateForICS = (date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export const sendInviteEmail = async (emailA, emailB, timeSlot, roomId) => {
  const startDate = new Date(timeSlot);
  // Assume interviews are 1 hour long
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); 

  const icsStart = formatDateForICS(startDate);
  const icsEnd = formatDateForICS(endDate);
  
  // The React frontend URL they will click
  const meetingLink = `http://localhost:5173/room/${roomId}`;

  // 2. Build the raw iCalendar String
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Automata//Mock Interview//EN
BEGIN:VEVENT
SUMMARY:Mock Interview - Automata Arena
DTSTART:${icsStart}
DTEND:${icsEnd}
DESCRIPTION:Your peer-to-peer mock interview is ready! Join your private room here: ${meetingLink}
LOCATION:${meetingLink}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  // 3. Send the email with the ICS attachment
  await transporter.sendMail({
    from: `"Automata" <${process.env.EMAIL_USER}>`,
    to: [emailA, emailB], // Send to both matched users at once
    subject: 'Your Mock Interview is Confirmed!',
    text: `You have been matched! Join your room at the scheduled time: ${meetingLink}`,
    attachments: [
      {
        filename: 'invite.ics',
        content: icsContent,
        contentType: 'text/calendar'
      }
    ]
  });
};