sed -i '/physicalLocation: {/i\
            structuredData: {\
              type: Type.OBJECT,\
              description: "Structured UI components to render (e.g. data tables, KPI cards, charts). Always use this INSTEAD of Markdown tables when the user requests tabular formats, reports, stats, etc.",\
              properties: {\
                type: {\
                  type: Type.STRING,\
                  description: "The type of visualization: \\"table\\", \\"kpi_cards\\", \\"chart\\", \\"timeline\\""\
                },\
                kpis: {\
                  type: Type.ARRAY,\
                  items: {\
                    type: Type.OBJECT,\
                    properties: {\
                      label: { type: Type.STRING },\
                      value: { type: Type.STRING },\
                      trend: { type: Type.STRING, description: "e.g. \\"up\\", \\"down\\", or neutral" }\
                    }\
                  }\
                },\
                table: {\
                  type: Type.OBJECT,\
                  properties: {\
                    columns: { type: Type.ARRAY, items: { type: Type.STRING } },\
                    rows: { \
                      type: Type.ARRAY, \
                      items: { \
                        type: Type.OBJECT, \
                        description: "Key-value pairs matching columns"\
                      } \
                    }\
                  }\
                },\
                chart: {\
                  type: Type.OBJECT,\
                  properties: {\
                    type: { type: Type.STRING, description: "bar, line, pie" },\
                    title: { type: Type.STRING },\
                    labels: { type: Type.ARRAY, items: { type: Type.STRING } },\
                    datasets: {\
                      type: Type.ARRAY,\
                      items: {\
                        type: Type.OBJECT,\
                        properties: {\
                          label: { type: Type.STRING },\
                          data: { type: Type.ARRAY, items: { type: Type.NUMBER } }\
                        }\
                      }\
                    }\
                  }\
                },\
                actions: {\
                  type: Type.ARRAY,\
                  items: { type: Type.STRING },\
                  description: "AI actions to show below the component, e.g. \\"Export Excel\\", \\"Summarize\\""\
                }\
              }\
            },' server.ts
