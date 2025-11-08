module.exports = (sequelize, Sequelize) => {
  const Session = sequelize.define("session", {
    session_date: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM('Draft', 'Published', 'Completed', 'Missed', 'Cancelled'),
      defaultValue: 'Draft', // New sessions will start as drafts
      allowNull: false
    },
    notes: {
      type: Sequelize.TEXT
    }
  });
  return Session;
};