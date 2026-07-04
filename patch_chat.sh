sed -i '/file?: {/i\
  structuredData?: {\
    type?: string;\
    kpis?: { label: string; value: string; trend?: string }[];\
    table?: {\
      columns: string[];\
      rows: Record<string, string | number>[];\
    };\
    chart?: {\
      type: string;\
      title: string;\
      labels: string[];\
      datasets: { label: string; data: number[] }[];\
    };\
    actions?: string[];\
  };\
' src/components/DcmsAiAssistant.tsx
