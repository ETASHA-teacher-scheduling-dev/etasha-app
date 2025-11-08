const controller = require("../controllers/authController");

module.exports = function(app) {
  // We need to pass the app instance to add headers
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // POST /api/auth/signin
  app.post("/api/auth/signin", controller.signin);
};