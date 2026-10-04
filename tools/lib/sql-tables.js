/* Tables the executed SQL examples run against: the Northwind company pack and the track files (paths under
   site/). Shared by tests/sql.test.js (SQLite) and tools/sqlserver-check.js (SQL Server). */
'use strict';
module.exports = {
  orders: 'data/experience/company/orders.csv', order_lines: 'data/experience/company/order_lines.csv', returns: 'data/experience/company/returns.csv',
  customers: 'data/experience/company/customers.csv', products: 'data/experience/company/products.csv', regions: 'data/experience/company/regions.csv',
  fx_rates: 'data/experience/company/fx_rates.csv', customer_changes: 'data/tracks/warehousing/customer_changes.csv', early_orders: 'data/tracks/warehousing/early_orders.csv',
  order_events: 'data/tracks/warehousing/order_events.csv', web_sessions_local: 'data/tracks/warehousing/web_sessions_local.csv', mini_sales: 'data/tracks/testing/mini_sales.csv'
};
