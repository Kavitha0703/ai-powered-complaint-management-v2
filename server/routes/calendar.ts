import { Router } from "express";
import {
  createCalendarEventOnServer,
  getServerCalendarEvents,
  deleteServerCalendarEvent,
} from "../google/calendar.js";

const router = Router();

// GET /api/calendar/events
router.get("/events", (req, res) => {
  const events = getServerCalendarEvents();
  res.json({ success: true, events });
});

// POST /api/calendar/create
router.post("/create", async (req, res) => {
  const { summary, description, startTime, endTime, attendees, addMeet } = req.body;
  if (!summary || !startTime || !endTime) {
    return res.status(400).json({ success: false, error: "Missing required calendar fields" });
  }

  const event = await createCalendarEventOnServer({
    summary,
    description,
    startTime,
    endTime,
    attendees,
    addMeet: addMeet !== false,
  });

  res.json({ success: true, event });
});

// DELETE /api/calendar/delete
router.delete("/delete", (req, res) => {
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ success: false, error: "Missing event id" });
  }

  const deleted = deleteServerCalendarEvent(id);
  res.json({ success: deleted });
});

export default router;
