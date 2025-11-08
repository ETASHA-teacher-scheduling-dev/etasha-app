const db = require("../models");
const Session = db.session;

// This object defines the correct, nested relationships for eager loading.
const sessionIncludes = [
    {
        model: db.batch,
        attributes: ['batch_name'],
        required: false,
        // NESTED INCLUDE: Go one level deeper to get the Program
        include: [{
            model: db.program,
            attributes: ['program_name'],
            required: false
        }]
    },
    { model: db.module, attributes: ['name'], required: false },
    { model: db.trainer, attributes: ['name'], required: false }
];

// GET all sessions
exports.findAll = async (req, res) => {
  console.log("--- Fetching all sessions with correct nested includes ---");
  try {
    const sessions = await Session.findAll({ include: sessionIncludes });
    console.log(`--- Successfully fetched ${sessions.length} sessions ---`);
    res.status(200).send(sessions);
  } catch (err) {
    console.error("!!! FATAL ERROR FETCHING SESSIONS:", err); 
    res.status(500).send({ message: err.message || "Error retrieving sessions." });
  }
};

// CREATE a new session
exports.create = async (req, res) => {
  console.log("--- Creating session with body:", req.body);
  const { session_date, trainerId, batchId, moduleId, status } = req.body;

  if (!session_date || !trainerId || !batchId || !moduleId) {
      return res.status(400).send({ message: "Session date, trainer, batch, and module are required." });
  }

  try {
    const newSession = await Session.create({ session_date, trainerId, batchId, moduleId, status: status || 'Draft' });
    const result = await Session.findByPk(newSession.id, { include: sessionIncludes });
    res.status(201).send(result);
  } catch (err) {
    console.error("!!! FATAL ERROR CREATING SESSION:", err);
    res.status(500).send({ message: err.message });
  }
};

// UPDATE a session by ID
exports.update = async (req, res) => {
  const id = req.params.id;
  try {
    const [num] = await Session.update(req.body, { where: { id: id } });
    if (num == 1) {
      res.send({ message: "Session was updated successfully." });
    } else {
      res.status(404).send({ message: `Cannot update Session with id=${id}.` });
    }
  } catch (err) {
    res.status(500).send({ message: `Error updating Session with id=${id}` });
  }
};

// DELETE a session by ID
exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const num = await Session.destroy({ where: { id: id } });
    if (num == 1) {
      res.send({ message: "Session was deleted successfully!" });
    } else {
      res.status(404).send({ message: `Cannot delete Session with id=${id}.` });
    }
  } catch (err) {
    res.status(500).send({ message: `Could not delete Session with id=${id}` });
  }
};