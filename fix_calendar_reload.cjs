const fs = require('fs');
let content = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

const targetSave = `        savedEv = await createGoogleCalendarEvent(eventData, token);
        setEvents(prev => [...prev, savedEv]);
      }
      setShowEventModal(false);
    } catch (err) {`;

const replaceSave = `        savedEv = await createGoogleCalendarEvent(eventData, token);
        setEvents(prev => [...prev, savedEv]);
      }
      setShowEventModal(false);
      loadEvents(); // Reload events from Google Calendar to ensure sync
    } catch (err) {`;

content = content.replace(targetSave, replaceSave);

const targetDelete = `      await deleteGoogleCalendarEvent(deleteConfirmId, token || undefined, user?.id);
      setEvents(prev => prev.filter(ev => ev.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {`;

const replaceDelete = `      await deleteGoogleCalendarEvent(deleteConfirmId, token || undefined, user?.id);
      setEvents(prev => prev.filter(ev => ev.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      loadEvents(); // Reload events from Google Calendar to ensure sync
    } catch (err) {`;

content = content.replace(targetDelete, replaceDelete);

fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', content);
