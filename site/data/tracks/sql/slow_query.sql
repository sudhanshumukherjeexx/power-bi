-- The query behind FactSales (SQL Server). Runs for ~22 minutes against NorthwindDW.
-- dbo.OrderLines: 180M rows, clustered on (OrderID, LineNo). dbo.Orders: 72M rows, clustered on OrderID.
-- Nonclustered index IX_Orders_OrderDate ON dbo.Orders(OrderDate). No other indexes.

SELECT *
FROM dbo.OrderLines AS l
JOIN dbo.Orders AS o
  ON CONVERT(varchar(20), o.OrderID) = l.OrderID          -- Orders.OrderID is int, OrderLines.OrderID is varchar(20)
LEFT JOIN dbo.Customers AS c
  ON c.CustomerID = o.CustomerID
WHERE YEAR(o.OrderDate) = 2026
  AND UPPER(o.Status) = 'COMPLETED'
  AND (SELECT COUNT(*) FROM dbo.Returns AS r WHERE r.OrderID = l.OrderID AND r.[LineNo] = l.[LineNo]) = 0
ORDER BY o.OrderDate;

-- Actual execution plan (summary)
--  |--Sort (OrderDate)                                      cost 9%
--     |--Nested Loops (Left Anti Semi Join) per row          cost 21%   <- correlated COUNT(*) on Returns
--        |--Hash Match (Inner Join)                          cost 31%
--        |    |--Clustered Index Scan dbo.Orders  72M rows   cost 18%   <- YEAR() and CONVERT() prevent seeks
--        |    |--Clustered Index Scan dbo.OrderLines 180M    cost 19%
--        |--Table Scan dbo.Returns (executed 41M times)
-- Warnings: implicit conversion on OrderID; 61 columns returned (SELECT *); Power Query keeps 9 of them.
