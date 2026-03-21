const GmailService = {
  fetchThreads() {
    const labelName = CONFIG.labelToScan;
    const daysToScan = CONFIG.daysToScan;
    
    if (labelName) {
      const label = GmailApp.getUserLabelByName(labelName);
      if (!label) {
        throw new Error(`Label "${labelName}" not found. Create it in Gmail or change configuration.`);
      }

      return label.getThreads(0, 10);
    } else {
      // Search for emails with attachments or recent emails
      const query = `newer_than:${daysToScan}d has:attachment filename:pdf OR newer_than:${daysToScan}d`;
      return GmailApp.search(query, 0, 10);
    }
  },

  extractPdfAttachments(message) {
    if (!CONFIG.scanAttachments) return [];
    
    const attachments = message.getAttachments();
    const pdfList = [];
    
    attachments.forEach(attachment => {
      const name = attachment.getName();
      const contentType = attachment.getContentType();
      
      if (!name.toLowerCase().endsWith('.pdf') && !contentType.includes('pdf')) {
        return;
      }
      
      const sizeBytes = attachment.getSize();
      const sizeMB = sizeBytes / (1024 * 1024);
      
      if (sizeMB > CONFIG.maxPdfSizeMB) {
        console.log(`Skipping PDF ${name}: too large (${sizeMB.toFixed(2)} MB)`);
        return;
      }
      
      try {
        const bytes = attachment.getBytes();
        const base64 = Utilities.base64Encode(bytes);
        
        pdfList.push({
          name: name,
          base64: base64,
          size: sizeMB
        });
        
        console.log(`PDF extracted: ${name} (${sizeMB.toFixed(2)} MB)`);
      } catch (e) {
        console.error(`Error reading PDF ${name}:`, e);
      }
    });
    
    return pdfList;
  }
};