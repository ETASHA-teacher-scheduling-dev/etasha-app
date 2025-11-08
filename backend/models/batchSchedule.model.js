module.exports = (sequelize, Sequelize) => {
  const BatchSchedule = sequelize.define("batchSchedule", {
    batchId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'batches',
        key: 'id'
      }
    },
    week_number: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: 'Week number (1-9 for 2-month, 1-5 for 1-month)'
    },
    day_number: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: 'Day number (1-6 for Day 1 to Day 6)'
    },
    session_content: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Content/modules for this day and week'
    },
    session_date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Actual date when this session is scheduled'
    },
    status: {
      type: Sequelize.ENUM('scheduled', 'completed', 'cancelled', 'rescheduled'),
      defaultValue: 'scheduled'
    },
    trainerId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'trainers',
        key: 'id'
      }
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
    }
  });
  
  return BatchSchedule;
};
