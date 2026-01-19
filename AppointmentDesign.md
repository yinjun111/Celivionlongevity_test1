Build an appointment scheduling system with Google Calendar as the source of truth, plus a local SQLite database for the customer portal and internal records.

Core behavior

# Availability is computed by reading Google Calendar busy/free times for a specific doctor’s Google Calendar.

# When a user books an appointment:

# The user selects a doctor; the system resolves this to that doctor’s Google Calendar (calendar_id).

# Read the selected doctor’s Google Calendar to confirm the time slot is still free.

# Create the event in the doctor’s Google Calendar (this is the canonical booking).

# Write a matching appointment record to the local database.

# Store the Google Calendar calendar_id and event_id in the DB so both systems stay linked.

# Store the customer name (and customer_id if available) and doctor name (and doctor_id) with the appointment.

# When a user cancels an appointment:

# Look up the appointment in the DB using the appointment id.

# Retrieve the associated doctor’s calendar_id and the linked Google Calendar event_id.

# Delete (or mark cancelled) the corresponding event from the doctor’s Google Calendar.

# Update the DB record to cancelled (or delete it), preserving customer and doctor information for audit/history.

Data consistency requirements

# Google Calendar is the authoritative schedule for each doctor.

# The local DB mirrors calendar events for user login, history, and reporting.

# Every appointment record must reference:

# customer_name (and customer_id)

# doctor_name (and doctor_id)

# google_calendar_id (doctor-specific)

# google_event_id

# Prevent double-booking by re-checking the doctor’s calendar immediately before creating the event.

# If any step fails, mark the appointment as sync_pending or needs_repair and retry safely.

Implementation notes

# Use Google Calendar API for availability queries and event lifecycle management.

# Maintain a doctors table that maps doctor_id to doctor_name to google_calendar_id.

# Use the DB to power the customer portal (appointments, subscriptions, history) while Google Calendar remains the single source of scheduling truth.
