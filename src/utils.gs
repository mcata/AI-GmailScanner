const ProcessedEmails = {
  KEY: 'emails_processed_v1',
  MAX_SIZE: 1000,

  /**
   * Check if email was already processed
   */
  isProcessed(emailId) {
    const props = PropertiesService.getUserProperties();
    const data = props.getProperty(this.KEY);
    if (!data) return false;
    
    try {
      const list = JSON.parse(data);
      return list.includes(emailId);
    } catch (e) {
      console.error('Error parsing processed emails:', e);
      return false;
    }
  },

  markAsProcessed(emailId) {
    const props = PropertiesService.getUserProperties();
    let list = [];
    const existing = props.getProperty(this.KEY);
    
    if (existing) {
      try {
        list = JSON.parse(existing);
      } catch (e) {
        console.error('Corrupted data, resetting');
      }
    }
    
    list.push(emailId);
    
    // Keep only last MAX_SIZE items
    if (list.length > this.MAX_SIZE) {
      list = list.slice(-this.MAX_SIZE);
    }
    
    props.setProperty(this.KEY, JSON.stringify(list));
  },

  /**
   * Reset processing history
   */
  reset() {
    PropertiesService.getUserProperties().deleteProperty(this.KEY);
    console.log('Processing history cleared');
  }
};

const DateUtils = {
  /**
   * Validate date string format YYYY-MM-DD
   */
  isValidDate(dateString) {
    if (!dateString || typeof dateString !== 'string') return false;
    
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    const timestamp = date.getTime();
    
    if (isNaN(timestamp)) return false;
    
    // Check if date is reasonable (not in past year, not in 2+ years)
    const today = new Date();
    const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const yearAfter = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
    
    return date >= yearAgo && date <= yearAfter;
  },

  parseDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
};