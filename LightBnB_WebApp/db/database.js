const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require("pg");

const pool = new Pool({ // establish connection to database
  user: "development",
  password: "development", 
  host: "localhost",
  database: "lightbnb"
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool.query(`
  SELECT * FROM users
  WHERE email = $1
  `, [email])
  .then((result) => {
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  })
};


/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool.query(`
  SELECT * FROM users
  WHERE id = $1;
  `, [id])
  .then((result) => {
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  })
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool.query(`
  INSERT INTO users(name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *
  `, [user.name, user.email, user.password])
  .then((result) => {
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  })
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool.query(`
  SELECT
  reservations.*,
  properties.title,
  properties.thumbnail_photo_url,
  properties.cover_photo_url,
  properties.cost_per_night,
  properties.number_of_bedrooms,
  properties.number_of_bathrooms,
  properties.parking_spaces,
  AVG(property_reviews.rating) AS average_rating
FROM reservations
JOIN properties ON reservations.property_id = properties.id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = $1 AND reservations.end_date < now()::date
GROUP BY reservations.id, 
properties.title, 
properties.cost_per_night, 
properties.number_of_bedrooms, 
properties.number_of_bathrooms, 
properties.parking_spaces, 
properties.thumbnail_photo_url, 
properties.cover_photo_url
ORDER BY start_date
LIMIT $2
`, [guest_id, limit])
.then((result) => {
  return result.rows;
})
.catch((err) => {
  console.log(err.message);
})
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  const queryParams = [];
  let queryString = `
  SELECT 
  properties.*,
  AVG(property_reviews.rating) AS average_rating
  FROM properties
  JOIN property_reviews ON property_reviews.property_id = properties.id
  WHERE 1=1
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `
    AND city LIKE $${queryParams.length}`;
  }
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `
    AND owner_id = $${queryParams.length}`
  }
  if (options.minimum_price_per_night && options. maximum_price_per_night) {
    const centsMin = options.minimum_price_per_night * 100;
    const centsMax = options.maximum_price_per_night * 100;
    queryParams.push(`${centsMin}`, `${centsMax}`);
    queryString += `
    AND cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length}`
  }
  if (options.minimum_price_per_night) {
    const cents = options.minimum_price_per_night * 100;
    queryParams.push(`${cents}`);
    queryString += `
    AND cost_per_night >= $${queryParams.length}`
  }
  if (options.maximum_price_per_night) {
    const cents = options.maximum_price_per_night * 100;
    queryParams.push(`${cents}`);
    queryString += `
    AND cost_per_night <= $${queryParams.length}`
  }
  queryString += `
  GROUP BY properties.id`
  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `
    HAVING AVG(property_reviews.rating) >= $${queryParams.length}`
  }
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};`

  return pool.query(queryString, queryParams)
  .then((result) => {
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  const propertyCost = property.cost_per_night * 100;
  return pool.query(`
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *
  `,[property.owner_Id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, propertyCost, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms])
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
