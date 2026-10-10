-- ==============================================================================
-- CHRIST CLUB ONLINE STORE - AMAZON RDS POSTGRESQL DEMONSTRATION QUERIES
-- ==============================================================================
-- Course: MSc AIML Cloud Computing for AI
-- Description: Sample SQL queries demonstrating requirement 3:
--   "Create an Amazon RDS database, connect to it from EC2,
--    insert sample order records, and execute SQL queries."
-- ==============================================================================

-- HOW TO CONNECT FROM EC2 INSTANCE VIA PSQL:
-- 1. Install PostgreSQL client on Amazon Linux 2023:
--    sudo dnf install -y postgresql15
--
-- 2. Connect to RDS instance (replace <RDS_ENDPOINT> with your actual endpoint):
--    psql -h <RDS_ENDPOINT> -U postgres -d christclub
--
-- (Enter the master password when prompted)

--------------------------------------------------------------------------------
-- QUERY 1: List all orders retrieved from PostgreSQL (Ordered by newest first)
--------------------------------------------------------------------------------
SELECT 
    id,
    customer_name,
    amount,
    status,
    items_summary,
    created_at
FROM 
    orders
ORDER BY 
    created_at DESC;

--------------------------------------------------------------------------------
-- QUERY 2: Filter orders by status (e.g., all pending orders awaiting payment)
--------------------------------------------------------------------------------
SELECT 
    id,
    customer_name,
    amount,
    status,
    created_at
FROM 
    orders
WHERE 
    status = 'pending'
ORDER BY 
    amount DESC;

--------------------------------------------------------------------------------
-- QUERY 3: Calculate the total order value across all orders
--------------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_orders,
    SUM(amount) AS total_revenue,
    ROUND(AVG(amount), 2) AS average_order_value,
    MIN(amount) AS lowest_order,
    MAX(amount) AS highest_order
FROM 
    orders;

--------------------------------------------------------------------------------
-- QUERY 4: Group and count orders by status with subtotal values
--------------------------------------------------------------------------------
SELECT 
    status,
    COUNT(*) AS order_count,
    SUM(amount) AS status_revenue,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders)), 1) AS percentage_of_total
FROM 
    orders
GROUP BY 
    status
ORDER BY 
    order_count DESC;

--------------------------------------------------------------------------------
-- BONUS QUERY 5: Top customers by total spend
--------------------------------------------------------------------------------
SELECT 
    customer_name,
    COUNT(id) AS orders_placed,
    SUM(amount) AS total_spent
FROM 
    orders
GROUP BY 
    customer_name
ORDER BY 
    total_spent DESC
LIMIT 5;
