sed -i '/physicalLocation: rawResult.physicalLocation/s/.*/        physicalLocation: rawResult.physicalLocation,\n        structuredData: rawResult.structuredData/' src/components/DcmsAiAssistant.tsx
