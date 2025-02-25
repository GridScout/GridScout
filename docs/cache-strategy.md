# GridScout Cache Strategy Brainstorm

## 1. Data Separation
- **Historical Data:** Store static and unchanging data (e.g., driver career stats, historical races, race calendars) permanently in PostgreSQL.
- **Dynamic Data:** Cache data that updates frequently (e.g., live race standings, current results) in Redis with adjustable TTL.

## 2. TTL Settings
- **Driver Service (driver.ts):**
  - **Permanent Data:** Persist driver bio and career history in Postgres.
  - **Transient Data:** Cache recent race results and stats in Redis with a TTL of 300–600 seconds.
- **Standings Service (standings.ts):**
  - Use a strict TTL (e.g., 60 seconds) for live standings to force immediate refresh on expiration or a non-strict approach to serve stale data while refreshing in the background.
- **Calendar Service (calendar.ts):**
  - Use a longer TTL (e.g., 3600 seconds) since the calendar rarely changes after publication.

## 3. Caching Strategy Options
- **Strict TTL:** Fetch fresh data from the API
- **Non-Strict TTL:** Return slightly stale data and trigger an asynchronous refresh process.
- Provide configuration flags to let you choose strict vs. non-strict behavior per endpoint.

## 4. Database vs. Redis
- **PostgreSQL:** For permanent storage and querying of historical data.
- **Redis:** For fast, temporary caching of dynamic data with endpoint-specific TTLs.

## 5. Implementation Considerations
- Utilize configuration files to dynamically set TTL values and caching modes.
- Consider background job queues (e.g., Bull, RabbitMQ) for non-strict cache updates.
- Maintain or enhance your existing key-generation strategy to support these caching modes.