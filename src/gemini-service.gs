const GeminiService = {
  /**
   * Analyze email content and PDFs
   */
  analyzeContent(subject, body, from, pdfAttachments) {
    const systemPrompt = this._buildSystemPrompt();

    const parts = [
      { text: systemPrompt },
      { text: `\n\nEMAIL DATA:\nFrom: ${from}\nSubject: ${subject}\nBody: ${body.substring(0, 3000)}` }
    ];

    // Add PDFs as inline data
    pdfAttachments.forEach((pdf, index) => {
      parts.push({
        text: `\n\n[PDF ATTACHMENT ${index + 1}: ${pdf.name}]\n`
      });
      parts.push({
        inline_data: {
          mime_type: "application/pdf",
          data: pdf.base64
        }
      });
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.geminiModel}:generateContent?key=${CONFIG.geminiApiKey}`;
    
    const payload = {
      contents: [{ parts: parts }],
      generationConfig: {
        temperature: 0.05,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        topP: 0.1
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_NONE"
        }
      ]
    };

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      const json = JSON.parse(response.getContentText());
      
      if (responseCode !== 200) {
        console.error('Gemini API error:', json);
        return null;
      }

      if (json.error) {
        console.error('Gemini API error:', json.error);
        return null;
      }

      const text = json.candidates[0].content.parts[0].text;
      return this._parseResponse(text);
      
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return null;
    }
  },

  _buildSystemPrompt() {
    return `You are an expert assistant specialized in extracting deadlines, payment dates, and appointments from emails and PDF documents.

TASK: Analyze the provided email and PDFs, extract relevant deadline information, and return a JSON object.

EXTRACTION RULES:
1. Identify types: bills (electricity, gas, phone, rent, taxes), appointments (medical, meetings), administrative deadlines
2. For bills: extract amount, beneficiary/company, payment codes, IBAN if present
3. For appointments: extract date, time, location, doctor/organizer name
4. Dates must be in YYYY-MM-DD format (if year missing, use current year)
5. Times in 24h format HH:MM (optional)
6. Amounts as numbers (e.g., 125.50)

OUTPUT FORMAT (JSON):
{
  "type": "bill|event|deadline|other",
  "expiry_date": "2026-03-25",
  "hour": "14:30",
  "title": "max 60 chars descriptive",
  "amount": 125.50,
  "beneficiary": "Company or person name",
  "description": "max 100 chars, payment codes, refs",
  "reminder": 3,
  "source": "pdf|email"
}

VALIDATION:
- If no relevant deadline found: return {"type": "other"}
- If ambiguous: make best guess and include uncertainty in description
- reminder suggestions: 3 days for bills, 1 day for medical, 7 days for annual deadlines
- description max 100 characters, no complete sentences

Respond ONLY with the JSON object, no markdown formatting, no explanations.`;
  },

  _parseResponse(responseText) {
    try {
      // Clean markdown if present
      let cleanText = responseText;
      if (responseText.includes('```json')) {
        cleanText = responseText.match(/```json\n?([\s\S]*?)\n?```/)?.[1] || responseText;
      } else if (responseText.includes('```')) {
        cleanText = responseText.match(/```\n?([\s\S]*?)\n?```/)?.[1] || responseText;
      }
      
      cleanText = cleanText.trim();
      const data = JSON.parse(cleanText);
      
      // Validate structure
      if (!data || data.type === 'other') return null;
      if (!data.expiry_date || !DateUtils.isValidDate(data.expiry_date)) {
        console.log('Invalid or missing date:', data.expiry_date);
        return null;
      }
      
      // Normalize
      if (data.amount && typeof data.amount === 'string') {
        data.amount = parseFloat(data.amount.replace(/[^\d.-]/g, ''));
      }
      
      return data;
      
    } catch (e) {
      console.error('Error parsing Gemini response:', e, '\nResponse:', responseText);
      return null;
    }
  }
};