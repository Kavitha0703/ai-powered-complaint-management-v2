import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const router = Router();

const getTokensFile = () => path.join(process.cwd(), "google_tokens.json");

async function getUserTokens(userId: string) {
  try {
    if (!existsSync(getTokensFile())) return null;
    const data = await fs.readFile(getTokensFile(), "utf-8");
    const tokens = JSON.parse(data);
    return tokens[userId];
  } catch (e) {
    return null;
  }
}

async function saveUserTokens(userId: string, tokens: any) {
  try {
    let allTokens: any = {};
    if (existsSync(getTokensFile())) {
      allTokens = JSON.parse(await fs.readFile(getTokensFile(), "utf-8"));
    }
    allTokens[userId] = tokens;
    await fs.writeFile(getTokensFile(), JSON.stringify(allTokens, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save tokens", e);
  }
}

router.post("/auth", async (req, res) => {
  const { code, userId } = req.body;
  if (!code || !userId) {
    return res.status(400).json({ error: "Missing code or userId" });
  }

  try {
    const oauth2Client = new OAuth2Client(
      process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "postmessage"
    );

    const { tokens } = await oauth2Client.getToken(code);
    await saveUserTokens(userId, tokens);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Google Auth Exchange Error:", err);
    res.status(500).json({ error: "Failed to exchange authorization code." });
  }
});

router.post("/meet", async (req, res) => {
  const { userId, summary } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const tokens = await getUserTokens(userId);
  if (!tokens || !tokens.access_token) {
    return res.status(401).json({ error: "Not authenticated with Google" });
  }

  try {
    const oauth2Client = new OAuth2Client(
      process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials(tokens);

    // If token is expired and we have a refresh token, the client will automatically refresh it
    // But we need to handle if it fails
    const tokenInfo = await oauth2Client.getAccessToken();
    const accessToken = tokenInfo.token;

    const response = await fetch("https://meet.googleapis.com/v2/spaces", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({}) // Space creation takes empty body for default config
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Google Meet API Error:", errText);
      return res.status(response.status).json({ error: "Google Meet API failed", details: errText });
    }

    const spaceData = await response.json();
    res.json({ success: true, meetingUri: spaceData.meetingUri, meetingCode: spaceData.meetingCode, space: spaceData.name });

  } catch (err: any) {
    console.error("Google Meet Creation Error:", err);
    res.status(500).json({ error: "Failed to create Google Meet" });
  }
});

export default router;
