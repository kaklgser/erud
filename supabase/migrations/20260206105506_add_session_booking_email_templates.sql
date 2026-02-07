/*
  # Add Session Booking Email Templates

  1. New Email Templates
    - `session_booking_confirmation` - sent to client after successful booking + payment
      Variables: recipientName, serviceTitle, bookingDate, slotLabel, bookingCode, bonusCredits, supportEmail
    - `session_booking_mentor_notification` - sent to mentor/admin when new session is booked
      Variables: clientName, clientEmail, serviceTitle, bookingDate, slotLabel, bookingCode
    - `session_reminder_24h` - sent 24 hours before session to client
      Variables: recipientName, serviceTitle, bookingDate, slotLabel, bookingCode, supportEmail
    - `session_cancellation` - sent when client cancels a session
      Variables: recipientName, serviceTitle, bookingDate, slotLabel, bookingCode, supportEmail

  2. Notes
    - Templates are inserted into the existing `email_templates` table
    - Uses IF NOT EXISTS pattern via ON CONFLICT to avoid duplicates
    - All templates use {{ variable }} syntax compatible with the existing replaceTemplateVariables helper
*/

INSERT INTO email_templates (template_name, subject, html_content, text_content, variables, is_active)
VALUES
  (
    'session_booking_confirmation',
    'Session Confirmed: {{ serviceTitle }} on {{ bookingDate }}',
    '',
    'Hi {{ recipientName }}, your session "{{ serviceTitle }}" is confirmed for {{ bookingDate }} at {{ slotLabel }}. Booking Code: {{ bookingCode }}. Bonus Credits: {{ bonusCredits }}.',
    '["recipientName","serviceTitle","bookingDate","slotLabel","bookingCode","bonusCredits","supportEmail"]',
    true
  ),
  (
    'session_booking_mentor_notification',
    'New Session Booked: {{ serviceTitle }} on {{ bookingDate }}',
    '',
    'New session booked by {{ clientName }} ({{ clientEmail }}) for {{ serviceTitle }} on {{ bookingDate }} at {{ slotLabel }}. Booking Code: {{ bookingCode }}.',
    '["clientName","clientEmail","serviceTitle","bookingDate","slotLabel","bookingCode"]',
    true
  ),
  (
    'session_reminder_24h',
    'Reminder: Your session is tomorrow - {{ serviceTitle }}',
    '',
    'Hi {{ recipientName }}, this is a reminder that your session "{{ serviceTitle }}" is scheduled for {{ bookingDate }} at {{ slotLabel }}. Booking Code: {{ bookingCode }}.',
    '["recipientName","serviceTitle","bookingDate","slotLabel","bookingCode","supportEmail"]',
    true
  ),
  (
    'session_cancellation',
    'Session Cancelled: {{ serviceTitle }} on {{ bookingDate }}',
    '',
    'Hi {{ recipientName }}, your session "{{ serviceTitle }}" on {{ bookingDate }} at {{ slotLabel }} has been cancelled. Booking Code: {{ bookingCode }}.',
    '["recipientName","serviceTitle","bookingDate","slotLabel","bookingCode","supportEmail"]',
    true
  )
ON CONFLICT (template_name) DO NOTHING;
