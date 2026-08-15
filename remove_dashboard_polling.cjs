const fs = require('fs');
let content = fs.readFileSync('src/components/DashboardLayout.tsx', 'utf-8');
content = content.replace(`    loadAlerts();
    // Refresh alerts periodically
    const timer = setInterval(loadAlerts, 15000);
    return () => clearInterval(timer);
  }, [dbUser]);`, `    loadAlerts();
  }, [dbUser]);`);
fs.writeFileSync('src/components/DashboardLayout.tsx', content);
