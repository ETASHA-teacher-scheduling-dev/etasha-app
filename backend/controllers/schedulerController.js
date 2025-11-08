const db = require("../models");
const { Op } = require("sequelize");
const moment = require('moment'); // We need this for date calculations

const Session = db.session;
const Leave = db.leave;
const Trainer = db.trainer;

// Endpoint to generate a draft schedule for the upcoming week
exports.generateDraft = async (req, res) => {
    console.log("--- Received request to generate draft schedule ---");
    // Define the date ranges. We look at the CURRENT week as the template for NEXT week.
    const currentWeekStart = moment().startOf('isoWeek').toDate();
    const currentWeekEnd = moment().endOf('isoWeek').toDate();

    try {
        // 1. Find all PUBLISHED sessions from THIS week to use as a template
        const templateSessions = await Session.findAll({
            where: {
                status: 'Published',
                session_date: { [Op.between]: [currentWeekStart, currentWeekEnd] }
            }
        });

        if (templateSessions.length === 0) {
            return res.status(200).send({ message: "No published sessions found in the current week to use as a template." });
        }

        // 2. Prepare an array of new draft sessions
        const newDraftSessions = templateSessions.map(session => {
            // Roll the date forward by exactly 7 days
            const newSessionDate = moment(session.session_date).add(7, 'days').toDate();

            return {
                programId: session.programId,
                moduleId: session.moduleId,
                trainerId: session.trainerId,
                centerId: session.centerId,
                session_date: newSessionDate,
                status: 'Draft', // CRUCIAL: All new sessions are drafts
            };
        });
        
        // 3. Bulk create all the new draft sessions in the database
        await Session.bulkCreate(newDraftSessions);

        res.status(200).send({ message: `${newDraftSessions.length} draft sessions created for the next week.` });

    } catch (err) {
        console.error("!!! FATAL ERROR generating draft schedule:", err);
        res.status(500).send({ message: "Failed to generate draft schedule. Check server logs." });
    }
};

// Endpoint to publish all draft sessions for a given week
exports.publishWeek = async (req, res) => {
    console.log("--- Received request to publish schedule ---");
    // Define the date range for the UPCOMING week
    const nextWeekStart = moment().add(1, 'weeks').startOf('isoWeek').toDate();
    const nextWeekEnd = moment().add(1, 'weeks').endOf('isoWeek').toDate();

    try {
        // Find all 'Draft' sessions within the next week and update their status to 'Published'
        const [updateCount] = await Session.update(
            { status: 'Published' }, // The new value
            {
                where: {
                    status: 'Draft',
                    session_date: { [Op.between]: [nextWeekStart, nextWeekEnd] }
                }
            }
        );

        if (updateCount === 0) {
            return res.status(200).send({ message: "No draft sessions found for the upcoming week to publish." });
        }

        res.status(200).send({ message: `${updateCount} sessions have been published successfully.` });

    } catch (err) {
        console.error("!!! FATAL ERROR publishing schedule:", err);
        res.status(500).send({ message: "Failed to publish schedule. Check server logs." });
    }
};