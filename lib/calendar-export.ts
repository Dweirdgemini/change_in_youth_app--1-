/**
 * Calendar Export Utility
 * 
 * Generates .ics (iCalendar) files for exporting schedules to Apple Calendar, Google Calendar, etc.
 */

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  status?: string;
}

/**
 * Format date for iCalendar format (YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special characters for iCalendar format
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate .ics file content for a single event
 */
export function generateICSForEvent(event: CalendarEvent): string {
  const now = new Date();
  const dtstamp = formatICalDate(now);
  const dtstart = formatICalDate(event.startTime);
  const dtend = formatICalDate(event.endTime);
  
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Change In Youth//Session Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:session-${event.id}@changein youth.org`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeICalText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICalText(event.location)}`);
  }

  if (event.status) {
    // Map status to iCalendar status
    const icalStatus = event.status === 'completed' ? 'CONFIRMED' : 
                       event.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED';
    lines.push(`STATUS:${icalStatus}`);
  }

  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Generate .ics file content for multiple events
 */
export function generateICSForMultipleEvents(events: CalendarEvent[]): string {
  const now = new Date();
  const dtstamp = formatICalDate(now);
  
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Change In Youth//Session Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Change In Youth Sessions',
    'X-WR-TIMEZONE:Europe/London',
  ];

  for (const event of events) {
    const dtstart = formatICalDate(event.startTime);
    const dtend = formatICalDate(event.endTime);
    
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:session-${event.id}@changeinyouth.org`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${dtstart}`);
    lines.push(`DTEND:${dtend}`);
    lines.push(`SUMMARY:${escapeICalText(event.title)}`);

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
    }

    if (event.location) {
      lines.push(`LOCATION:${escapeICalText(event.location)}`);
    }

    if (event.status) {
      const icalStatus = event.status === 'completed' ? 'CONFIRMED' : 
                         event.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED';
      lines.push(`STATUS:${icalStatus}`);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Download .ics file (web only)
 */
export function downloadICSFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Share .ics file (mobile)
 */
export async function shareICSFile(content: string, filename: string) {
  // For React Native, we would use expo-sharing
  // This is a placeholder implementation
  try {
    // TODO: Implement with expo-sharing when needed
    console.log('ICS File Content:', content);
    return content;
  } catch (error) {
    console.error('Error sharing ICS file:', error);
    throw error;
  }
}
