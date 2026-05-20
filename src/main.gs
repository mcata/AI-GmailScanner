/**
 * Main processing function
 * Run this manually or via daily trigger
 */
function processEmails() {
  const startTime = new Date();
  const reportItems = [];
  
  try {
    console.log('Starting deadline scan...');
    
    // Initialize if first run
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
      // Send an empty report to confirm execution
      ReportingService.sendReport([], { processed: 0, bills: 0, events: 0, errors: 0, skipped: 0, pdfs: 0 }, startTime);
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
        const msgSubject = message.getSubject();
        const msgSender = message.getFrom();
        
        if (ProcessedEmails.isProcessed(msgId)) {
          stats.skipped++;
          reportItems.push({
            subject: msgSubject,
            sender: msgSender,
            type: 'skipped',
            status: 'skipped',
            expiryDate: null,
            amount: null,
            calendarEventId: null,
            error: null
          });
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
          let eventId = null;
          let status = 'no_data';
          
          if (extractedData) {
            let createdEvent;
            
            if (extractedData.type === 'bill' || extractedData.type === 'deadline') {
              createdEvent = CalendarService.createBillEvent(extractedData, subject);
              stats.bills++;
              status = 'created';
            } else if (extractedData.type === 'event') {
              createdEvent = CalendarService.createGenericEvent(extractedData, subject);
              stats.events++;
              status = 'created';
            }

            if (createdEvent) {
              eventId = createdEvent.getId();
            }
            
            ProcessedEmails.markAsProcessed(msgId);
            stats.processed++;
            
            reportItems.push({
              subject: subject,
              sender: from,
              type: extractedData.type,
              status: status,
              expiryDate: extractedData.expiry_date,
              amount: extractedData.amount || null,
              calendarEventId: eventId,
              error: null
            });
          } else {
            // Mark as processed even if no data found (to avoid reprocessing)
            ProcessedEmails.markAsProcessed(msgId);
            reportItems.push({
              subject: subject,
              sender: from,
              type: 'other',
              status: 'no_data',
              expiryDate: null,
              amount: null,
              calendarEventId: null,
              error: null
            });
          }
          
        } catch (msgError) {
          console.error(`Error processing message ${msgId}:`, msgError);
          stats.errors++;
          
          reportItems.push({
            subject: msgSubject,
            sender: msgSender,
            type: 'error',
            status: 'error',
            expiryDate: null,
            amount: null,
            calendarEventId: null,
            error: msgError.message
          });
        }
      });
    });

    const summary = `Processed: ${stats.processed} | Bills: ${stats.bills} | Events: ${stats.events} | PDFs: ${stats.pdfs} | Skipped: ${stats.skipped} | Errors: ${stats.errors}`;
    console.log(summary);
    
    ReportingService.sendReport(reportItems, stats, startTime);
    
  } catch (error) {
    console.error('Fatal error:', error);
    ReportingService.sendReport(reportItems, { processed: 0, bills: 0, events: 0, errors: 1, skipped: 0, pdfs: 0 }, startTime);
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
 * Setup trigger to run weekly
 */
function createWeeklyTrigger() {
  // Remove existing triggers
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'processEmails')
    .forEach(t => ScriptApp.deleteTrigger(t));
  
  // Create new trigger
  ScriptApp.newTrigger('processEmails')
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
    
  console.log('Weekly trigger created (runs every Monday at 9:00 AM)');
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
