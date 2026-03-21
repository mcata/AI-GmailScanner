/**
 * Main processing function
 * Run this manually or via daily trigger
 */
function processEmails() {
  try {
    console.log('Starting deadline scan...');
    
    try {
      CONFIG.geminiApiKey;
    } catch (e) {
      console.error('First time setup required:', e.message);
      SpreadsheetApp.getActiveSpreadsheet()?.toast(
        'Configure GEMINI_API_KEY in Script Properties first!', 
        'Setup Required', 10
      );
      return;
    }
    
    const threads = GmailService.fetchThreads();
    
    if (threads.length === 0) {
      console.log('No emails to process');
      return;
    }
    
    const stats = {
      processed: 0,
      bills: 0,
      events: 0,
      pdfs: 0,
      errors: 0,
      skipped: 0
    };

    threads.forEach(thread => {
      const messages = thread.getMessages();
      
      messages.forEach(message => {
        const msgId = message.getId();
        
        if (ProcessedEmails.isProcessed(msgId)) {
          stats.skipped++;
          return;
        }

        try {
          const subject = message.getSubject();
          const body = message.getPlainBody();
          const from = message.getFrom();
          
          console.log(`Processing: "${subject}" from ${from}`);
          
          // Extract PDFs
          const pdfAttachments = GmailService.extractPdfAttachments(message);
          if (pdfAttachments.length > 0) {
            stats.pdfs += pdfAttachments.length;
          }
          
          // AI Analysis
          const extractedData = GeminiService.analyzeContent(subject, body, from, pdfAttachments);
          
          if (extractedData) {
            if (extractedData.type === 'bill' || extractedData.type === 'deadline') {
              CalendarService.createBillEvent(extractedData, subject);
              stats.bills++;
            } else if (extractedData.type === 'event') {
              CalendarService.createGenericEvent(extractedData, subject);
              stats.events++;
            }
            
            ProcessedEmails.markAsProcessed(msgId);
            stats.processed++;
          } else {
            // Mark as processed even if no data found (to avoid reprocessing)
            ProcessedEmails.markAsProcessed(msgId);
          }
          
        } catch (msgError) {
          console.error(`Error processing message ${msgId}:`, msgError);
          stats.errors++;
        }
      });
    });

    const summary = `Processed: ${stats.processed} | Bills: ${stats.bills} | Events: ${stats.events} | PDFs: ${stats.pdfs} | Skipped: ${stats.skipped} | Errors: ${stats.errors}`;
    console.log(summary);
    
  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  }
}

/**
 * Setup trigger to run daily
 */
function createDailyTrigger() {
  // Remove existing triggers
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'processEmails')
    .forEach(t => ScriptApp.deleteTrigger(t));
  
  // Create new trigger
  ScriptApp.newTrigger('processEmails')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
    
  console.log('Daily trigger created (runs at 9:00 AM)');
}

/**
 * Remove all triggers
 */
function removeTriggers() {
  const count = ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'processEmails')
    .map(t => ScriptApp.deleteTrigger(t))
    .length;
    
  console.log(`Removed ${count} trigger(s)`);
}

/**
 * Setup script (run once after deployment)
 */
function setup() {
  CONFIG.initialize();
}

/**
 * Reset processing history
 */
function resetHistory() {
  ProcessedEmails.reset();
}