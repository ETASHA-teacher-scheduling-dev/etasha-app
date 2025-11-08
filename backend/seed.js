const db = require('./models');
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const dbConfig = require('./config/db.config');

const Trainer = db.trainer;
const Module = db.module;
const Program = db.program;
const Center = db.center;
const Batch = db.batch;
const Session = db.session;
const BatchSchedule = db.batchSchedule;

// --- DATA DEFINITIONS ---
const allModulesData = [
  { name: 'Prep and Screening English SVO', module_code: 'Prep 1', category: 'Prep' },
  { name: 'OA 1 One-on-one discussion', module_code: 'OA 1', category: 'OA' },
  { name: 'Structure of presentation', module_code: 'BSC 1', category: 'BSC' },
  { name: 'Intro to PPT & Google docs', module_code: 'BIT 1', category: 'BIT' },
  { name: 'Communication Skills', module_code: 'COM 1', category: 'Communication' },
  { name: 'Interview Preparation', module_code: 'INT 1', category: 'Interview' },
  { name: 'Mock Interview Session', module_code: 'MOCK 1', category: 'Mock' },
  { name: 'Resume Writing', module_code: 'RES 1', category: 'Resume' }
];

const usersToCreateData = [
  { name: 'Admin Scheduler', email: 'admin@etasha.com', password: 'password_admin', role: 'scheduler' },
  // South Delhi trainers
  { name: 'Kuldeep', email: 'kuldeep@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 1 Hauzkhas' },
  { name: 'Smriti', email: 'smriti@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 1 Hauzkhas' },
  { name: 'Gul Sanovar', email: 'gul.sanovar@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 2 Khanpur' },
  { name: 'Amit Kumar', email: 'amit.kumar@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 2 Khanpur' },
  { name: 'Rahul Khushwaha', email: 'rahul.khushwaha@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 2 Khanpur' },
  { name: 'Kajal Aggarwal', email: 'kajal.aggarwal@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 7 Vasant Vihar' },
  { name: 'Sanjana', email: 'sanjana@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 7 Vasant Vihar' },
  { name: 'Smriti Malviya', email: 'smriti.malviya@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 8 Malviya Nagar' },
  { name: 'Satyajeet', email: 'satyajeet@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 12 Lakkarpur' },
  // North Delhi trainers
  { name: 'Amit Sharan', email: 'amit.sharan@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 3 Mangolpuri' },
  { name: 'Priyanka', email: 'priyanka@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 3 Mangolpuri' },
  { name: 'Santosh', email: 'santosh@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 10 Kirari' },
  { name: 'Khushboo', email: 'khushboo@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 10 Kirari' },
  // East Delhi trainers
  { name: 'Kishan', email: 'kishan@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 11 Khora' },
  { name: 'Leema', email: 'leema@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 11 Khora' },
  // Delhi NCR trainers
  { name: 'Sooraj', email: 'sooraj@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 6 Gurugram' },
  { name: 'Kuldeep Gurugram', email: 'kuldeep.gurugram@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 6 Gurugram' },
  { name: 'Nasim', email: 'nasim@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 9 Gurugram' },
  { name: 'Shabnam', email: 'shabnam@etasha.com', password: 'password_trainer', role: 'trainer', centerName: 'CDC 9 Gurugram' }
];

const centersData = [
  // South Delhi Centers
  { name: 'CDC 1 Hauzkhas', location: 'South Delhi', zone: 'South Delhi' },
  { name: 'CDC 2 Khanpur', location: 'South Delhi', zone: 'South Delhi' },
  { name: 'CDC 7 Vasant Vihar', location: 'South Delhi', zone: 'South Delhi' },
  { name: 'CDC 8 Malviya Nagar', location: 'South Delhi', zone: 'South Delhi' },
  { name: 'CDC 12 Lakkarpur', location: 'South Delhi', zone: 'South Delhi' },
  // North Delhi Centers
  { name: 'CDC 3 Mangolpuri', location: 'North Delhi', zone: 'North Delhi' },
  { name: 'CDC 10 Kirari', location: 'North Delhi', zone: 'North Delhi' },
  // East Delhi Centers
  { name: 'CDC 11 Khora', location: 'East Delhi', zone: 'East Delhi' },
  // Delhi NCR Centers
  { name: 'CDC 6 Gurugram', location: 'Delhi NCR', zone: 'Delhi NCR' },
  { name: 'CDC 9 Gurugram', location: 'Delhi NCR', zone: 'Delhi NCR' }
];

// --- MAIN SEEDER FUNCTION ---
async function run() {
  console.log('--- Starting seeder ---');

  // 0. CREATE DATABASE IF IT DOESN'T EXIST
  console.log('\n--- Creating database if it doesn\'t exist ---');
  try {
    // Create a connection without specifying a database to create the database
    const sequelizeWithoutDB = new Sequelize({
      host: dbConfig.HOST,
      dialect: dbConfig.dialect,
      username: dbConfig.USER,
      password: dbConfig.PASSWORD,
      logging: false
    });

    // Create the database if it doesn't exist
    await sequelizeWithoutDB.query(`CREATE DATABASE IF NOT EXISTS "${dbConfig.DB}";`);
    console.log(`✅ Database "${dbConfig.DB}" created or already exists.`);
    
    // Close the connection
    await sequelizeWithoutDB.close();
  } catch (error) {
    // For PostgreSQL, we need to handle this differently
    console.log('Attempting PostgreSQL database creation...');
    try {
      const sequelizePostgres = new Sequelize({
        host: dbConfig.HOST,
        dialect: dbConfig.dialect,
        username: dbConfig.USER,
        password: dbConfig.PASSWORD,
        database: 'postgres', // Connect to default postgres database
        logging: false
      });

      // Check if database exists, create if not
      const [results] = await sequelizePostgres.query(
        `SELECT 1 FROM pg_database WHERE datname = '${dbConfig.DB}'`
      );
      
      if (results.length === 0) {
        await sequelizePostgres.query(`CREATE DATABASE "${dbConfig.DB}"`);
        console.log(`✅ PostgreSQL database "${dbConfig.DB}" created.`);
      } else {
        console.log(`✅ PostgreSQL database "${dbConfig.DB}" already exists.`);
      }
      
      await sequelizePostgres.close();
    } catch (pgError) {
      console.log(`Database creation attempted. Proceeding with seeding...`);
    }
  }

  // 1. SYNC DATABASE (create tables if they don't exist)
  await db.sequelize.sync({ force: false });
  console.log('✅ Database synced. Tables created if they don\'t exist.');

  // 2. SEED USERS (TRAINERS)
  console.log('\n--- Seeding Users ---');
  for (const userData of usersToCreateData) {
    const existingUser = await Trainer.findOne({ where: { email: userData.email } });
    if (!existingUser) {
      await Trainer.create({
        name: userData.name,
        email: userData.email,
        password: bcrypt.hashSync(userData.password, 10),
        role: userData.role,
        status: 'active'
      });
    }
  }
  const userCount = await Trainer.count();
  console.log(`✅ ${userCount} users in database.`);

  // 3. SEED MODULES (COURSES)
  console.log('\n--- Seeding Modules ---');
  const existingModules = await Module.findAll();
  let createdModules = existingModules;
  
  if (existingModules.length === 0) {
    createdModules = await Module.bulkCreate(allModulesData, { returning: true });
  }
  console.log(`✅ ${createdModules.length} modules in database.`);

  // 4. SEED PROGRAMS (TEMPLATES)
  console.log('\n--- Seeding Programs ---');
  let bSmart2Month = await Program.findOne({ where: { program_name: 'B SMART 2-Month' } });
  let bSmart1Month = await Program.findOne({ where: { program_name: 'B SMART 1-Month' } });
  
  if (!bSmart2Month) {
    bSmart2Month = await Program.create({
      program_name: 'B SMART 2-Month',
      description: 'A comprehensive 2-month program for the service sector.',
      duration_months: 2,
    });
  }

  if (!bSmart1Month) {
    bSmart1Month = await Program.create({
      program_name: 'B SMART 1-Month',
      description: 'A focused 1-month program for essential job skills.',
      duration_months: 1,
    });
  }
  console.log('✅ Program templates ready.');

  // 5. ASSOCIATE MODULES WITH PROGRAMS
  console.log('\n--- Associating Modules with Programs ---');
  // Associate all created modules with the 2-month program
  await bSmart2Month.setModules(createdModules);
  console.log(`Associated ${createdModules.length} modules with "${bSmart2Month.program_name}".`);

  // Associate a smaller subset (e.g., the first 2) with the 1-month program
  await bSmart1Month.setModules([createdModules[0], createdModules[1]]);
  console.log(`Associated 2 modules with "${bSmart1Month.program_name}".`);

  // 6. SEED CENTERS
  console.log('\n--- Seeding Centers ---');
  const existingCenters = await Center.findAll();
  let createdCenters = existingCenters;
  
  if (existingCenters.length === 0) {
    createdCenters = await Center.bulkCreate(centersData, { returning: true });
  }
  console.log(`✅ ${createdCenters.length} centers in database.`);

  // 7. SEED BATCHES
  console.log('\n--- Seeding Batches ---');
  const batchesData = [
    {
      batch_name: 'Delhi Batch 2024-01',
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-03-15'),
      status: 'Ongoing',
      programId: bSmart2Month.id,
      centerId: createdCenters[0].id
    },
    {
      batch_name: 'Mumbai Batch 2024-02',
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-04-01'),
      status: 'Ongoing',
      programId: bSmart2Month.id,
      centerId: createdCenters[1].id
    },
    {
      batch_name: 'Bangalore Batch 2024-03',
      start_date: new Date('2024-03-01'),
      end_date: new Date('2024-04-01'),
      status: 'Completed',
      programId: bSmart1Month.id,
      centerId: createdCenters[2].id
    },
    {
      batch_name: 'Chennai Batch 2024-04',
      start_date: new Date('2024-04-15'),
      end_date: new Date('2024-06-15'),
      status: 'Ongoing',
      programId: bSmart2Month.id,
      centerId: createdCenters[3].id
    }
  ];
  
  const existingBatches = await Batch.findAll();
  let createdBatches = existingBatches;
  
  if (existingBatches.length === 0) {
    createdBatches = await Batch.bulkCreate(batchesData, { returning: true });
  }
  console.log(`✅ ${createdBatches.length} batches in database.`);

  // 8. SEED TRAINING SESSIONS
  console.log('\n--- Seeding Training Sessions ---');
  const trainers = await Trainer.findAll({ where: { role: 'trainer' } });
  const sessionsData = [];
  
  // Generate sessions for the last 3 months to show in reports
  const today = new Date();
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  
  // Create sessions for each batch
  for (const batch of createdBatches) {
    const batchProgram = await Program.findByPk(batch.programId, { 
      include: [{ model: Module }] 
    });
    
    // Create sessions for each module in the program
    for (let i = 0; i < batchProgram.modules.length; i++) {
      const module = batchProgram.modules[i];
      
      // Create 2-3 sessions per module
      for (let sessionNum = 1; sessionNum <= 2; sessionNum++) {
        const sessionDate = new Date(threeMonthsAgo);
        sessionDate.setDate(sessionDate.getDate() + (i * 7) + (sessionNum * 3)); // Space sessions
        
        // Randomly assign trainer and status
        const randomTrainer = trainers[Math.floor(Math.random() * trainers.length)];
        const statuses = ['Completed', 'Cancelled', 'Missed', 'Published'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        sessionsData.push({
          session_date: sessionDate,
          status: randomStatus,
          notes: `${module.name} session ${sessionNum} for ${batch.batch_name}`,
          batchId: batch.id,
          trainerId: randomTrainer.id,
          moduleId: module.id
        });
      }
    }
  }
  
  const existingSessions = await Session.findAll();
  let createdSessions = existingSessions;
  
  if (existingSessions.length === 0) {
    createdSessions = await Session.bulkCreate(sessionsData, { returning: true });
  }
  console.log(`✅ ${createdSessions.length} training sessions in database.`);

  // 9. SEED BATCH SCHEDULES (Sample data from CSV files)
  console.log('\n--- Seeding Batch Schedules ---');
  const batchScheduleData = [];

  // Sample schedule data for B SMART 2-Month program (based on CSV)
  const twoMonthSchedule = [
    // Week 1
    { week: 1, day: 1, content: "Prep 1 and Screening English SVO" },
    { week: 1, day: 2, content: "Prep 2 and Screening Computer" },
    { week: 1, day: 3, content: "Prep 3 and Screening Interpersonal & Cyber Security" },
    { week: 1, day: 4, content: "OA 1 One-on-one discussion & Orientation to B SMART" },
    { week: 1, day: 5, content: "B SE 1 introduction, B I 1 Team work" },
    { week: 1, day: 6, content: "B SE 2 simple tenses/ Conversation session, B SC 3 Grooming" },
    
    // Week 2
    { week: 2, day: 1, content: "B SC 1 Structure of presentation, BIT 1 Intro to PPT" },
    { week: 2, day: 2, content: "BIT 3 PPT prep., B SC 2 Presentation Delivery" },
    { week: 2, day: 3, content: "B SC 2 cont., B SE 3 Continuous tense/ Conversation session" },
    { week: 2, day: 4, content: "B I 2 listening skills, B SE 4 Preposition of place" },
    { week: 2, day: 5, content: "B SE 5 Letter writing, AI tools & chatGPT" },
    { week: 2, day: 6, content: "BIT 5 intro to word Part 1 & 2" },
    
    // Week 3
    { week: 3, day: 1, content: "BIT 4 Emailing, BIT 6 Google docs" },
    { week: 3, day: 2, content: "B WOW 1 reality of work, B CSS 1 intro to sales" },
    { week: 3, day: 3, content: "B I 3 Fb & Improvement, Visit to ITES" },
    { week: 3, day: 4, content: "BIT 8 intro to excel, BIT 10 Excel Formatting" },
    { week: 3, day: 5, content: "B WOW 4 Reality of ITES, BFSI- Knowledge Financial products" },
    { week: 3, day: 6, content: "B CSS 11 tele sales, B SE 11" },
  ];

  // Sample schedule for B SMART 1-Month program
  const oneMonthSchedule = [
    // Week 1
    { week: 1, day: 1, content: "Prep 1/ Screening 4 hours" },
    { week: 1, day: 2, content: "OA 1 one on one discussion 5 hours" },
    { week: 1, day: 3, content: "I 1 team work, B SE 1 intro" },
    { week: 1, day: 4, content: "B SC 3 Grooming, B SC 1 Structure of presen" },
    { week: 1, day: 5, content: "BIT 1 intro to ppt, BIT 2 presentation prep" },
    { week: 1, day: 6, content: "B SC 2 Presentation delivery, B I 3 Fb & Improvement" },
    
    // Week 2
    { week: 2, day: 1, content: "BIT 5 part a & b" },
    { week: 2, day: 2, content: "B SE 5 letter writing (Home Assignment), AI & chat GPT, BIT 4 Emailing" },
    { week: 2, day: 3, content: "B WOW 1, B CSS 1 intro to sales" },
    { week: 2, day: 4, content: "B SE 7 Adjective -Describing products, Bit 9 Google drive" },
    { week: 2, day: 5, content: "Hospitality or Retail visit" },
    { week: 2, day: 6, content: "B WOW 2 Reality of R or H, BIT 8 intro to excel" },
  ];

  // Create batch schedules for each batch
  for (const batch of createdBatches) {
    const batchProgram = await Program.findByPk(batch.programId);
    const scheduleTemplate = batchProgram.duration_months === 2 ? twoMonthSchedule : oneMonthSchedule;
    const batchTrainers = trainers.filter(t => t.centerId === batch.centerId);
    
    scheduleTemplate.forEach(scheduleItem => {
      // Calculate session date based on batch start date
      const sessionDate = new Date(batch.start_date);
      const daysToAdd = (scheduleItem.week - 1) * 7 + (scheduleItem.day - 1);
      sessionDate.setDate(sessionDate.getDate() + daysToAdd);
      
      // Assign random trainer from same center
      const randomTrainer = batchTrainers.length > 0 
        ? batchTrainers[Math.floor(Math.random() * batchTrainers.length)]
        : trainers[Math.floor(Math.random() * trainers.length)];
      
      batchScheduleData.push({
        batchId: batch.id,
        week_number: scheduleItem.week,
        day_number: scheduleItem.day,
        session_content: scheduleItem.content,
        session_date: sessionDate.toISOString().split('T')[0],
        status: 'scheduled',
        trainerId: randomTrainer.id
      });
    });
  }

  const existingBatchSchedules = await BatchSchedule.findAll();
  let createdBatchSchedules = existingBatchSchedules;
  
  if (existingBatchSchedules.length === 0) {
    createdBatchSchedules = await BatchSchedule.bulkCreate(batchScheduleData, { returning: true });
  }
  console.log(`✅ ${createdBatchSchedules.length} batch schedule entries in database.`);
}

// --- EXECUTION ---
run().then(() => {
  console.log('\n--- Seeding process finished successfully. ---');
  db.sequelize.close();
}).catch((error) => {
  console.error('\n!!! Seeder failed with a critical error:', error);
  db.sequelize.close();
  process.exit(1);
});