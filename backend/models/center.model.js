module.exports = (sequelize, Sequelize) => {
  const Center = sequelize.define("center", {
    // We already have this
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    // The "location" field will now be the more detailed address
    address: {
      type: Sequelize.TEXT, // Using TEXT for longer addresses
    },
    // --- NEW FIELDS ---
    location_id: {
      type: Sequelize.STRING,
      unique: true, // Good for an internal ID
    },
    owner_name: {
      type: Sequelize.STRING,
    },
    owner_contact: {
      type: Sequelize.STRING,
    },
    maintenance_contact: {
      type: Sequelize.STRING,
    },
    gps_coordinates: {
      type: Sequelize.STRING,
    }
  });
  return Center;
};