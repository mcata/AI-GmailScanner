const CONFIG = {
  KEYS: {
    GEMINI_API_KEY: 'GEMINI_API_KEY',
    LABEL_TO_SCAN: 'LABEL_TO_SCAN',
    CALENDAR_ID: 'CALENDAR_ID',
    DAYS_TO_SCAN: 'DAYS_TO_SCAN',
    SEND_REPORT_EMAIL: 'SEND_REPORT_EMAIL',
    REPORT_EMAIL_TO: 'REPORT_EMAIL_TO'
  },

  // Default values
  DEFAULTS: {
    LABEL_TO_SCAN: 'deadlines',
    DAYS_TO_SCAN: 7,
    CALENDAR_ID: 'primary',
    MAX_PDF_SIZE_MB: 10,
    SCAN_ATTACHMENTS: true,
    GEMINI_MODEL: 'gemini-2.5-flash',
    SEND_REPORT_EMAIL: 'true'
  },

  initialize() {
    const props = PropertiesService.getScriptProperties();
    
    // Set defaults only if not present
    if (!props.getProperty(this.KEYS.DAYS_TO_SCAN)) {
      props.setProperty(this.KEYS.DAYS_TO_SCAN, this.DEFAULTS.DAYS_TO_SCAN.toString());
    }
    if (!props.getProperty(this.KEYS.LABEL_TO_SCAN)) {
      props.setProperty(this.KEYS.LABEL_TO_SCAN, this.DEFAULTS.LABEL_TO_SCAN);
    }
    if (!props.getProperty(this.KEYS.CALENDAR_ID)) {
      props.setProperty(this.KEYS.CALENDAR_ID, this.DEFAULTS.CALENDAR_ID);
    }
    if (!props.getProperty(this.KEYS.SEND_REPORT_EMAIL)) {
      props.setProperty(this.KEYS.SEND_REPORT_EMAIL, this.DEFAULTS.SEND_REPORT_EMAIL);
    }
    
    console.log('Configuration initialized. Remember to set GEMINI_API_KEY in Script Properties.');
  },

  get geminiApiKey() {
    const key = PropertiesService.getScriptProperties().getProperty(this.KEYS.GEMINI_API_KEY);
    if (!key) throw new Error('GEMINI_API_KEY not set in Script Properties.');
    return key;
  },

  get geminiModel() {
    return this.DEFAULTS.GEMINI_MODEL;
  },

  get labelToScan() {
    return PropertiesService.getScriptProperties().getProperty(this.KEYS.LABEL_TO_SCAN) 
      || this.DEFAULTS.LABEL_TO_SCAN;
  },

  get daysToScan() {
    const val = PropertiesService.getScriptProperties().getProperty(this.KEYS.DAYS_TO_SCAN);
    return val ? parseInt(val) : this.DEFAULTS.DAYS_TO_SCAN;
  },

  get calendarId() {
    return PropertiesService.getScriptProperties().getProperty(this.KEYS.CALENDAR_ID) 
      || this.DEFAULTS.CALENDAR_ID;
  },

  get scanAttachments() {
    return this.DEFAULTS.SCAN_ATTACHMENTS;
  },

  get maxPdfSizeMB() {
    return this.DEFAULTS.MAX_PDF_SIZE_MB;
  },

  get sendReportEmail() {
    const val = PropertiesService.getScriptProperties().getProperty(this.KEYS.SEND_REPORT_EMAIL);
    return val !== 'false';
  },

  get reportEmailTo() {
    return PropertiesService.getScriptProperties().getProperty(this.KEYS.REPORT_EMAIL_TO);
  }
};