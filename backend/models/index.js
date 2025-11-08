const { Sequelize } = require("sequelize");
const dbConfig = require("../config/db.config.js");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: dbConfig.pool,
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// --- MODEL IMPORTS ---
db.trainer = require("./trainer.model.js")(sequelize, Sequelize);
db.module = require("./module.model.js")(sequelize, Sequelize);
db.center = require("./center.model.js")(sequelize, Sequelize);
db.session = require("./session.model.js")(sequelize, Sequelize);
db.program = require("./program.model.js")(sequelize, Sequelize);
db.batch = require("./batch.model.js")(sequelize, Sequelize);
db.leave = require("./leave.model.js")(sequelize, Sequelize);
db.batchSchedule = require("./batchSchedule.model.js")(sequelize, Sequelize);

// --- RELATIONSHIPS ---

// A Program (template) has many Modules (courses)
db.program.belongsToMany(db.module, { through: "ProgramModules" });
db.module.belongsToMany(db.program, { through: "ProgramModules" });

// A Batch is an instance of a Program at a Center
db.program.hasMany(db.batch);
db.batch.belongsTo(db.program);
db.center.hasMany(db.batch);
db.batch.belongsTo(db.center);

// Sessions belong to a Batch
db.batch.hasMany(db.session);
db.session.belongsTo(db.batch);

// A Trainer teaches many Sessions
db.trainer.hasMany(db.session);
db.session.belongsTo(db.trainer);

// A Module is taught in many Sessions
db.module.hasMany(db.session);
db.session.belongsTo(db.module);

db.center.hasMany(db.trainer);
db.trainer.belongsTo(db.center);

// A Trainer is qualified for MANY Modules. A Module can be taught by MANY Trainers.
db.trainer.belongsToMany(db.module, { through: "TrainerModules" });
db.module.belongsToMany(db.trainer, { through: "TrainerModules" });

// A Trainer can have many Leaves
db.trainer.hasMany(db.leave);
db.leave.belongsTo(db.trainer);

// BatchSchedule relationships
db.batch.hasMany(db.batchSchedule);
db.batchSchedule.belongsTo(db.batch);
db.trainer.hasMany(db.batchSchedule);
db.batchSchedule.belongsTo(db.trainer);

module.exports = db;