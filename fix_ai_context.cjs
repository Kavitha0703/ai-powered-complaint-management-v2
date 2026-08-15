const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPages.tsx', 'utf-8');

const target1 = `    setSelectedTicket(ticket);`;
const replacement1 = `    setSelectedTicket(ticket);
    if (ticket) {
      window.dispatchEvent(new CustomEvent('dcms_context_update', { detail: { selectedTicketId: ticket.id, selectedTicketTitle: ticket.title, selectedTicketDescription: ticket.description, selectedTicketCategory: ticket.issue_type } }));
    }`;

content = content.replace(target1, replacement1);

const target2 = `  const load = () => {`;
const replacement2 = `
  useEffect(() => {
    if (!selectedTicket) {
      window.dispatchEvent(new CustomEvent('dcms_context_update', { detail: { selectedTicketId: null } }));
    }
  }, [selectedTicket]);

  const load = () => {`;

content = content.replace(target2, replacement2);

fs.writeFileSync('src/pages/AdminPages.tsx', content);
