CREATE TABLE IF NOT EXISTS `guests` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL UNIQUE,
  `status` text NOT NULL DEFAULT 'pending' CHECK(`status` IN ('attending','declined','maybe','pending')),
  `guest_count` integer NOT NULL DEFAULT 1,
  `dietary` text,
  `message` text,
  `created_at` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  `updated_at` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
