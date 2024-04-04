SELECT
  reservations.id,
  properties.title,
  properties.cost_per_night,
  start_date,
  AVG(property_reviews.rating) AS average_rating
FROM reservations
JOIN users ON guest_id = users.id
JOIN properties ON reservations.property_id = properties.id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE users.id = 1
GROUP BY reservations.id, properties.title, properties.cost_per_night
ORDER BY start_date
LIMIT 10;
