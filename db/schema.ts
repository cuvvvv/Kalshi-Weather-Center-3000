import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const weatherSnapshots=sqliteTable('weather_snapshots',{
 id:text('id').primaryKey(),product:text('product').notNull(),station:text('station').notNull(),eventDate:text('event_date').notNull(),capturedAt:integer('captured_at').notNull(),forecastIssuedAt:text('forecast_issued_at'),observedAt:text('observed_at'),quality:text('quality').notNull(),payload:text('payload').notNull()
},t=>[index('weather_product_date_time').on(t.product,t.eventDate,t.capturedAt)]);
