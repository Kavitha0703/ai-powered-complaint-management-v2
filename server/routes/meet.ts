import { Router } from "express";
import {
  createGoogleMeetOnServer,
  getServerMeetings,
  endServerMeeting,
} from "../google/meet.js";

const router = Router();

// GET /api/meet/status
router.get("/status", (req, res) => {
  const meetings = getServerMeetings();
  res.json({ success: true, meetings });
});

// POST /api/meet/create
router.post("/create", async (req, res) => {
  const { title, hostName, participants } = req.body;
  const meeting = await createGoogleMeetOnServer(title, hostName, participants);
  res.json({ success: true, meeting });
});

// POST /api/meet/end
router.post("/end", (req, res) => {
  const { meetingId } = req.body;
  if (!meetingId) {
    return res.status(400).json({ success: false, error: "Missing meetingId" });
  }

  const success = endServerMeeting(meetingId);
  res.json({ success });
});

export default router;
