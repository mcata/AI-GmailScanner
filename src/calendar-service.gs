const CalendarService = {
  createBillEvent(data, emailSubject) {
    try {
      const calendar = CalendarApp.getCalendarById(CONFIG.calendarId);
      const date = DateUtils.parseDate(data.expiry_date);
      
      let event;
      
      // Create event
      if (data.hour && data.hour.match(/^\d{2}:\d{2}$/)) {
        const [hours, minutes] = data.hour.split(':').map(Number);
        const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
        event = calendar.createEvent(data.title, startTime, endTime);
      } else {
        event = calendar.createAllDayEvent(data.title, date);
      }

      // Build description
      const lines = [];
      if (data.amount) lines.push(`💰 Amount: ${data.amount.toFixed(2)} €`);
      if (data.beneficiary) lines.push(`🏢 Beneficiary: ${data.beneficiary}`);
      if (data.description) lines.push(`📝 Details: ${data.description}`);
      lines.push(`📧 Source: ${data.source || 'email'}`);
      lines.push(`\n---\nFrom email: ${emailSubject}`);
      
      event.setDescription(lines.join('\n'));
      event.setColor(CalendarApp.EventColor.RED);
      
      // Set reminders
      const reminderDays = data.reminder || 3;
      const reminderMinutes = reminderDays * 24 * 60;
      
      event.removeAllReminders();
      event.addPopupReminder(reminderMinutes);
      
      // Email reminder
      if (data.amount) {
        event.addEmailReminder(reminderMinutes);
      }
      
      console.log(`Bill event created: "${data.title}" on ${data.expiry_date}`);
      return event;
      
    } catch (e) {
      console.error('Error creating bill event:', e);
      throw e;
    }
  },

  createGenericEvent(data, emailSubject) {
    try {
      const calendar = CalendarApp.getCalendarById(CONFIG.calendarId);
      const date = DateUtils.parseDate(data.expiry_date);
      
      let event;
      if (data.hour && data.hour.match(/^\d{2}:\d{2}$/)) {
        const [hours, minutes] = data.hour.split(':').map(Number);
        const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours default
        event = calendar.createEvent(data.title, startTime, endTime);
      } else {
        event = calendar.createAllDayEvent(data.title, date);
      }

      const lines = [];
      if (data.description) lines.push(data.description);
      lines.push(`Source: ${data.source || 'email'}`);
      lines.push(`\nFrom: ${emailSubject}`);
      
      event.setDescription(lines.join('\n'));
      event.setColor(CalendarApp.EventColor.BLUE);
      
      const reminderDays = data.reminder || 1;
      event.removeAllReminders();
      event.addPopupReminder(reminderDays * 24 * 60);
      
      console.log(`Event created: "${data.title}" on ${data.expiry_date}`);
      return event;
      
    } catch (e) {
      console.error('Error creating generic event:', e);
      throw e;
    }
  }
};