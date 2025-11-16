import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';

// Helper function for bulk update detection
function isBulkUpdate(event) {
  // Simple bulk operation detection
  return event.before && Object.keys(event.before).length > 5;
}

// Helper function for anomaly detection
function detectAnomaly(event, explanation) {
  const suspiciousKeywords = ['suspicious', 'unusual', 'risky', 'concerning', 'abnormal', 'malicious'];
  const lowerExplanation = explanation.toLowerCase();
  
  // Basic anomaly detection rules
  if (event.type === 'DELETE') {
    return true; // Mark all DELETEs as potential anomalies for now
  }
  
  if (event.type === 'UPDATE' && isBulkUpdate(event)) {
    return true;
  }
  
  // Check if AI explanation contains suspicious keywords
  return suspiciousKeywords.some(keyword => lowerExplanation.includes(keyword));
}

export async function explainChange(event) {
  try {
    // For now, return mock AI explanations until Ollama is set up
    const mockExplanations = {
      INSERT: [
        "A new record was added to the database. This appears to be a normal data insertion operation.",
        "Record created in the table. This is a standard database operation.",
        "New entry inserted. No anomalies detected in this operation.",
        "Data insertion completed successfully. This is a routine database activity.",
        "A new row was added to the table. The operation seems legitimate and expected."
      ],
      UPDATE: [
        "An existing record was modified. This update changed some field values in the table.",
        "Record updated with new values. This is a typical database maintenance operation.",
        "Data modification completed. The changes appear to be routine updates.",
        "Field values were updated in the record. This is a standard database operation.",
        "Record information was modified. No suspicious activity detected."
      ],
      DELETE: [
        "A record was removed from the database. Monitor if this is part of normal cleanup operations.",
        "Record deleted from the table. Verify if this deletion was intentional.",
        "Data removal operation completed. Check if this aligns with expected data lifecycle.",
        "Row deleted from the database. This could be part of routine maintenance or cleanup.",
        "Record removal detected. Ensure this is authorized and expected activity."
      ]
    };

    const explanations = mockExplanations[event.type] || mockExplanations.UPDATE;
    const randomExplanation = explanations[Math.floor(Math.random() * explanations.length)];
    
    // Simple anomaly detection using the helper function
    const isAnomaly = detectAnomaly(event, randomExplanation);

    return {
      explanation: randomExplanation,
      isAnomaly: isAnomaly,
      confidence: isAnomaly ? 0.75 : 0.90,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('AI explanation failed:', error);
    return {
      explanation: 'Unable to analyze this change at the moment. Please check the AI service.',
      isAnomaly: false,
      confidence: 0.0,
      timestamp: new Date().toISOString()
    };
  }
}

// Real Ollama integration (commented out for now)
/*
async function callOllama(prompt) {
  try {
    const response = await axios.post(OLLAMA_URL, {
      model: 'llama3:8b',
      prompt: prompt,
      stream: false
    }, {
      timeout: 30000
    });
    return response.data.response;
  } catch (error) {
    throw new Error(`Ollama API error: ${error.message}`);
  }
}

function buildPrompt(event) {
  return `
As a SQL database expert, analyze this database change:

Operation: ${event.type}
Table: ${event.table}
Before: ${JSON.stringify(event.before, null, 2)}
After: ${JSON.stringify(event.after, null, 2)}

Please provide:
1. A simple explanation of what changed
2. Whether this seems normal or suspicious
3. Potential implications
4. Any recommendations

Keep response concise and professional.
  `.trim();
}
*/