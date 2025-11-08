module.exports = (sequelize, Sequelize) => {
  const Program = sequelize.define("program", {
    program_name: { type: Sequelize.STRING, allowNull: false, unique: true },
    description: { type: Sequelize.TEXT },
    duration_months: { type: Sequelize.INTEGER }
  });
  return Program;
};