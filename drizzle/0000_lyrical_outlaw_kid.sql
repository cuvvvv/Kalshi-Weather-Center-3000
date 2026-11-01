CREATE TABLE `weather_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`product` text NOT NULL,
	`station` text NOT NULL,
	`event_date` text NOT NULL,
	`captured_at` integer NOT NULL,
	`forecast_issued_at` text,
	`observed_at` text,
	`quality` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `weather_product_date_time` ON `weather_snapshots` (`product`,`event_date`,`captured_at`);