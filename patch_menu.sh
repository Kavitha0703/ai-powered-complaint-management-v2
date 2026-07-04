sed -i '/const \[sandboxIsCached, setSandboxIsCached\] = useState(false);/a\  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);' src/pages/Home.tsx
