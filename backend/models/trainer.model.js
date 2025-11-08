module.exports = (sequelize, Sequelize) => {
  const Trainer = sequelize.define("trainer", {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    // --- NEW FIELDS ---
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    role: {
      // e.g., 'scheduler', 'trainer'
      type: Sequelize.STRING,
      defaultValue: 'trainer'
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false,
    },
    centerId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'centers',
        key: 'id'
      }
    }
  });
  return Trainer;
};