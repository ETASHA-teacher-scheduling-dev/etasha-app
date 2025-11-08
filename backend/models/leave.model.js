module.exports = (sequelize, Sequelize) => {
  const Leave = sequelize.define("leave", {
    start_date: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    end_date: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    reason: {
      type: Sequelize.STRING
    }
  });
  return Leave;
};