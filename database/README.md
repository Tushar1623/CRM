# Database setup

Run `schema.sql` against a PostgreSQL 15+ database. It creates the `crm` schema, multi-tenant data model, controlled lookup sets, integrity constraints, indexes, and updated-at triggers.

Authentication is deliberately delegated to the identity provider. In Supabase, make `crm.users.id` reference the corresponding `auth.users.id` through application logic or a foreign key if the permissions model permits it.

Add dealership-specific selectable values through `crm.lookup_values`; do not place customer, employee, lead, vehicle, follow-up, test-drive, or deal examples into migration files.
