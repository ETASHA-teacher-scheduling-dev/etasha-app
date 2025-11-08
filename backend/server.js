// Sync database and start server
db.sequelize.sync({ alter: true }).then(() => {
  console.log("✅ Database synced successfully with alter: true");
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}.`);
  });
}).catch(err => {
  console.error("❌ Unable to sync database:", err);
});
