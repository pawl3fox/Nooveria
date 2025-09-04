#!/bin/bash
# OrthodoxGPT Monitoring Script

echo "=== OrthodoxGPT System Status ==="
echo "Date: $(date)"
echo

# Container Status
echo "📦 Container Status:"
docker-compose ps
echo

# Database Stats
echo "📊 Database Statistics:"
docker-compose exec -T postgres psql -U postgres orthodoxgpt -c "
SELECT 
    'Users' as metric, COUNT(*) as count FROM users
UNION ALL
SELECT 
    'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 
    'Active Today', COUNT(DISTINCT user_id) FROM usage_records 
    WHERE created_at >= CURRENT_DATE;
" 2>/dev/null
echo

# Revenue Today
echo "💰 Today's Revenue:"
docker-compose exec -T postgres psql -U postgres orthodoxgpt -c "
SELECT 
    COALESCE(SUM(amount_tokens), 0) as tokens_used,
    ROUND(COALESCE(SUM(amount_tokens), 0) * 0.003 / 1000, 2) as revenue_usd,
    ROUND(COALESCE(SUM(amount_tokens), 0) * 0.001 / 1000, 2) as profit_usd
FROM transactions 
WHERE type = 'debit' 
AND created_at >= CURRENT_DATE;
" 2>/dev/null
echo

# System Resources
echo "🖥️  System Resources:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo

# Recent Errors
echo "🚨 Recent Backend Errors (last 10):"
docker-compose logs backend --tail=50 2>/dev/null | grep -i error | tail -10
echo

echo "=== End Status Report ==="