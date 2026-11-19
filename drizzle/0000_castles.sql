CREATE TABLE players (id TEXT PRIMARY KEY, secret TEXT NOT NULL, name TEXT NOT NULL, layout TEXT, gear INTEGER NOT NULL DEFAULT 0);
--> statement-breakpoint
CREATE TABLE raids (id TEXT PRIMARY KEY, attacker TEXT NOT NULL, defender TEXT, kind TEXT NOT NULL, layout TEXT NOT NULL, gear INTEGER NOT NULL, started INTEGER NOT NULL, result TEXT, reward INTEGER NOT NULL DEFAULT 0);
--> statement-breakpoint
CREATE INDEX raids_attacker ON raids(attacker);
--> statement-breakpoint
CREATE INDEX raids_defender ON raids(defender);
