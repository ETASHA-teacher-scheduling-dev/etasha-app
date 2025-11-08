module.exports = (sequelize, Sequelize) => {
  const Module = sequelize.define("module", {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: Sequelize.TEXT
    },
    // --- THIS IS THE MISSING FIELD ---
    duration: {
      type: Sequelize.INTEGER, // Storing duration as a number (e.g., hours)
      allowNull: true // It's optional, so it can be empty (null)
    },
    module_code: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true // Each code should be unique
    },
    category: {
      type: Sequelize.STRING // e.g., 'BSC', 'BIT', 'B WOW'
    }
  });
  return Module;
};