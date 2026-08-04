const fs = require('fs');
let code = fs.readFileSync('src/lib/google/gmail.ts', 'utf8');

code = code.replace(
  /if \(res\.ok\) \{/,
  `if (res.ok) {`
);

// We need to add the else block for !res.ok and disable fallback
code = code.replace(
  /if \(res\.ok\) \{\s*const json = await res\.json\(\);\s*const record: SentEmailRecord = \{[\s\S]*?\};\s*saveEmailToLog\(record\);\s*return \{ success: true, messageId: json\.id \};\s*\}\s*\} catch \(err\) \{\s*console\.warn\("Gmail direct REST API call fallback to logged send:", err\);\s*\}/,
  `if (res.ok) {
        const json = await res.json();
        const record: SentEmailRecord = {
          id: json.id || recordId,
          to,
          subject,
          bodyHtml,
          category,
          sentAt,
          senderEmail,
          status: 'Sent'
        };
        saveEmailToLog(record);
        return { success: true, messageId: json.id };
      } else {
        const errorText = await res.text();
        console.error("Gmail API Error:", res.status, errorText);
        return { success: false, error: \`Gmail API Error \${res.status}: \${errorText}\` };
      }
    } catch (err: any) {
      console.error("Gmail direct REST API call error:", err);
      return { success: false, error: err.message };
    }`
);

// Disable the fallback
code = code.replace(
  /\/\/ Simulated email dispatch fallback if no token[\s\S]*?return \{ success: true, messageId: recordId \};/,
  `// Simulated email dispatch fallback disabled for debugging
  console.error("No access token provided. Gmail simulated fallback is disabled.");
  return { success: false, error: "No access token provided. Not falling back to simulation." };`
);

fs.writeFileSync('src/lib/google/gmail.ts', code);
