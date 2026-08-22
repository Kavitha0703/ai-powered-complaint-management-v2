export async function createMeetSpace(accessToken: string) {
  const response = await fetch("https://meet.googleapis.com/v2/spaces", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return await response.json();
}

export async function getConferenceRecords(accessToken: string, spaceName: string) {
  const response = await fetch(`https://meet.googleapis.com/v2/${spaceName}/conferenceRecords`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return await response.json();
}

export async function getParticipants(accessToken: string, conferenceRecordName: string) {
  const response = await fetch(`https://meet.googleapis.com/v2/${conferenceRecordName}/participants`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return await response.json();
}
