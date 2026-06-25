
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

export default function VideoContainer({ roomId }) {
  const myMeeting = async (element) => {
    if (!element || !roomId) return;

    const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

    const userID = Math.floor(Math.random() * 10000).toString();
    const userName = `Engineer_${userID}`;

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomId,
      userID,
      userName
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    
    zp.joinRoom({
      container: element,
      sharedLinks: [
        {
          name: 'Interview Link',
          url: window.location.href,
        },
      ],
      scenario: {
        mode: ZegoUIKitPrebuilt.VideoConference, 
      },
      showScreenSharingButton: true,
      showPreJoinView: false,
      turnOnMicrophoneWhenJoining: false,
      turnOnCameraWhenJoining: false,
    });
  };

  if (!roomId) return null;

  return (
    <div className="w-full h-full bg-[#050505] relative overflow-hidden flex items-center justify-center border-l border-white/10">
      <div 
        className="myCallContainer" 
        ref={myMeeting} 
        style={{ width: '100%', height: '100%' }}
      ></div>
    </div>
  );
}