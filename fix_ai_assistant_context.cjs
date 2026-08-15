const fs = require('fs');
let content = fs.readFileSync('src/components/DcmsAiAssistant.tsx', 'utf-8');

const targetState = `  const [isOpen, setIsOpen] = useState(false);`;
const replacementState = `  const [isOpen, setIsOpen] = useState(false);
  const [activeContext, setActiveContext] = useState<any>(null);

  useEffect(() => {
    const handleContextUpdate = (e: any) => {
      const detail = e.detail;
      if (detail && detail.selectedTicketId) {
         setActiveContext({
             selectedTicketId: detail.selectedTicketId,
             title: detail.selectedTicketTitle,
             description: detail.selectedTicketDescription,
             category: detail.selectedTicketCategory
         });
      } else {
         setActiveContext(null);
      }
    };
    window.addEventListener('dcms_context_update', handleContextUpdate);
    return () => window.removeEventListener('dcms_context_update', handleContextUpdate);
  }, []);
`;
content = content.replace(targetState, replacementState);

const targetSysContext = `            userProfile: { name: dbUser.name, email: dbUser.email, id: dbUser.id }
          };
        } else {`;
const replacementSysContext = `            userProfile: { name: dbUser.name, email: dbUser.email, id: dbUser.id },
            activeViewContext: activeContext
          };
        } else {`;

content = content.replace(targetSysContext, replacementSysContext);
content = content.replace(`            userProfile: { name: dbUser.name, email: dbUser.email, id: dbUser.id }
          };
        } else if (dbUser && chatbotMode === "admin") {`, `            userProfile: { name: dbUser.name, email: dbUser.email, id: dbUser.id },
            activeViewContext: activeContext
          };
        } else if (dbUser && chatbotMode === "admin") {`);

fs.writeFileSync('src/components/DcmsAiAssistant.tsx', content);
