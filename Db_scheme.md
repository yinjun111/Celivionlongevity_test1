Here’s a compact 6-table SQLite design that still stays sane (login + profile + subscriptions + appointments), without extra tables like addresses, sessions, providers, services.

6-table minimal schema

Table 1: users
Stores identity + contact info (including address in same row to avoid an addresses table).

id (PK)

email (unique) or username (unique)

full_name

phone

address_line1

address_line2

city

state

postal_code

country

status (active/disabled)

created_at

updated_at

Table 2: user_auth
Stores password hash only (never raw password).

user_id (PK, FK -> users.id)

password_hash

password_updated_at

Table 3: plans
Defines subscription plans.

id (PK)

name (unique)

price_cents

billing_period (monthly/yearly)

is_active

Table 4: subscriptions
Links a user to a plan and tracks current state. (Supports upgrades/cancel later.)

id (PK)

user_id (FK)

plan_id (FK)

status (active/canceled/trialing/past_due)

start_at

current_period_start

current_period_end

cancel_at (nullable)

Table 5: appointments
Stores appointment records.

id (PK)

user_id (FK)

start_at

end_at

status (booked/canceled/completed/no_show)

notes (nullable)

created_at

updated_at

Table 6: password_reset_tokens (optional but usually necessary)
If you need “forgot password”. If you truly don’t need it, drop this and you have 5 tables.

id (PK)

user_id (FK)

token_hash

expires_at

used_at (nullable)

created_at

If you want exactly 5 tables
Drop password_reset_tokens and handle password reset manually (admin sets password) or implement reset via your auth provider instead.
