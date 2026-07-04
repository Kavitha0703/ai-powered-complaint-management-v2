import re
with open("server.ts", "r") as f:
    text = f.read()

pattern = r'"INTELLIGENCE & ANALYSIS \(AI ANALYSIS\):"\+"- If the user describes a problem, complaint, or delay \(e\.g\., \'Salary delayed\'\), provide a detailed AI Analysis using the \'aiAnalysis\' JSON object\."\+"- Populate \'detectedIssue\', \'confidence\' \(e\.g\., \'97%\'\), \'priority\' \(e\.g\., \'Urgent\'\), \'businessImpact\', \'rootCause\', \'recommendedAction\', \'estimatedResolution\', and \'sla\'\."\+"TRUTH & TRANSPARENCY RULES:'

good_text = '"INTELLIGENCE & ANALYSIS (AI ANALYSIS):\\n" + "\\n- If the user describes a problem, complaint, or delay (e.g., \'Salary delayed\'), provide a detailed AI Analysis using the \'aiAnalysis\' JSON object.\\n" + "\\n- Populate \'detectedIssue\', \'confidence\' (e.g., \'97%\'), \'priority\' (e.g., \'Urgent\'), \'businessImpact\', \'rootCause\', \'recommendedAction\', \'estimatedResolution\', and \'sla\'.\\n\\n" + "\\nTRUTH & TRANSPARENCY RULES:'

text = re.sub(pattern, good_text, text)

with open("server.ts", "w") as f:
    f.write(text)
