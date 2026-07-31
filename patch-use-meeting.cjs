const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminTeamChat.tsx', 'utf8');

const targetStr = `  const {
    
    localCamStream, screenStream, userStream, audioLevel,
    micPermission, camPermission, speechStatus, setSpeechStatus,
    isVoicePlaybackMuted, setIsVoicePlaybackMuted, meetings, setMeetings,
    requestMicrophone, requestCamera, requestScreenShare, stopScreenShare,
    postHuddleNotes, speakText
  } = useMeeting();`;

const replacementStr = `  const [meetings, setMeetings] = useState<RecentCall[]>([]);
  
  const speakText = (text: string, voiceName?: string) => {
    // Legacy voice mock
    console.log(\`Speaking (\${voiceName}): \${text}\`);
  };`;

content = content.replace(targetStr, replacementStr);

const visualizerTarget = content.substring(content.indexOf('  // Speaks live audio peak wave'), content.indexOf('  // Helper time formatter'));
content = content.replace(visualizerTarget, '');

fs.writeFileSync('src/pages/AdminTeamChat.tsx', content);
