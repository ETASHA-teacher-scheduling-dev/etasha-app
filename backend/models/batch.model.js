// This model represents a specific group of students.
module.exports = (sequelize, Sequelize) => {
  const Batch = sequelize.define("batch", {
    batch_name: { type: Sequelize.STRING, allowNull: false },
    start_date: { type: Sequelize.DATE, allowNull: false },
    end_date: { type: Sequelize.DATE },
    status: { type: Sequelize.ENUM('Ongoing', 'Completed', 'Upcoming'), defaultValue: 'Upcoming' }
    // It will be linked to a Program and a Center.
  });
  return Batch;
};