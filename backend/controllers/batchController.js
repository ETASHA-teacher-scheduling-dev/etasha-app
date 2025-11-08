const db = require("../models");
const Batch = db.batch;
const Program = db.program;
const Center = db.center;
const Module = db.module; // Import the Module model

// This object defines the related data we want to fetch with every batch
const batchIncludes = [
    {
      model: Program,
      attributes: ['id', 'program_name'],
      required: false,
      // Nested Include: For each Program, also include its associated Modules
      include: [{
        model: Module,
        attributes: ['id', 'name', 'module_code'], // Get module details for the dropdown
        through: { attributes: [] }, // Exclude the join table's data (ProgramModules)
        required: false
      }]
    },
    {
      model: Center,
      attributes: ['id', 'name'],
      required: false
    }
];

// GET all batches, including their Program, Modules, and Center
exports.findAll = async (req, res) => {
  console.log("--- Fetching all batches with nested includes ---");
  try {
    const batches = await Batch.findAll({
      include: batchIncludes,
      order: [['start_date', 'DESC']] // Show the newest batches first
    });
    console.log(`--- Controller found ${batches.length} batches ---`);
    res.status(200).send(batches);
  } catch (err) {
    console.error("!!! ERROR fetching batches:", err);
    res.status(500).send({ message: err.message || "Error retrieving batches." });
  }
};

// CREATE a new batch
exports.create = async (req, res) => {
  console.log("--- Creating batch with body:", req.body);
  const { batch_name, start_date, programId, centerId } = req.body;

  if (!batch_name || !start_date || !programId || !centerId) {
      return res.status(400).send({ message: "Batch Name, Start Date, Program, and Center are required." });
  }

  try {
    const batch = await Batch.create(req.body);
    // Fetch the full data with associations to send back to the client
    const result = await Batch.findByPk(batch.id, { include: batchIncludes });
    res.status(201).send(result);
  } catch (err) {
    console.error("!!! ERROR creating batch:", err);
    res.status(500).send({ message: err.message });
  }
};

// UPDATE an existing batch by ID
exports.update = async (req, res) => {
  const id = req.params.id;
  console.log(`--- Updating batch ${id} ---`);
  try {
    const [num] = await Batch.update(req.body, { where: { id: id } });
    if (num == 1) {
      res.send({ message: "Batch was updated successfully." });
    } else {
      res.status(404).send({ message: `Cannot update Batch with id=${id}.` });
    }
  } catch (err) {
    console.error(`!!! ERROR updating batch ${id}:`, err);
    res.status(500).send({ message: `Error updating Batch with id=${id}` });
  }
};

// DELETE a batch by ID
exports.delete = async (req, res) => {
  const id = req.params.id;
  console.log(`--- Deleting batch ${id} ---`);
  try {
    const num = await Batch.destroy({ where: { id: id } });
    if (num == 1) {
      res.send({ message: "Batch was deleted successfully!" });
    } else {
      res.status(404).send({ message: `Cannot delete Batch with id=${id}.` });
    }
  } catch (err) {
    console.error(`!!! ERROR deleting batch ${id}:`, err);
    res.status(500).send({ message: `Could not delete Batch with id=${id}` });
  }
};