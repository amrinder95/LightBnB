SELECT 
  properties.id AS id,
  title,
  cost_per_night,
  AVG(rating) AS average_rating
FROM properties
LEFT JOIN property_reviews ON property_id = properties.id
WHERE city LIKE '%ancouve%'
GROUP BY properties.id
HAVING AVG(property_reviews.rating) >= 4
ORDER BY cost_per_night
LIMIT 10;