const fs = require('fs');
const files = [
  'src/pages/UserPages.tsx',
  'src/pages/AdminPages.tsx',
  'src/pages/Home.tsx',
  'src/components/DcmsAiAssistant.tsx',
  'src/components/DashboardLayout.tsx',
  'server.ts'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // UI strings replacement
    content = content.replace(/Register Complaint/g, 'Create Ticket');
    content = content.replace(/register complaint/g, 'create ticket');
    content = content.replace(/Registering Complaint/g, 'Creating Ticket');
    content = content.replace(/My Complaints/g, 'My Tickets');
    content = content.replace(/My complaints/g, 'My tickets');
    content = content.replace(/Complaint Type/g, 'Request Category');
    content = content.replace(/Complaints/g, 'Tickets');
    content = content.replace(/complaints/g, 'tickets');
    content = content.replace(/Complaint/g, 'Ticket');
    content = content.replace(/complaint/g, 'ticket');
    
    // Branding
    content = content.replace(/Digital Ticket Management System/g, 'Digital Workplace Operations Platform');
    content = content.replace(/DCMS/g, 'Workplace Hub');

    fs.writeFileSync(file, content);
  }
});
