const express = require('express');
const authController = require('../controllers/authController');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { signupSchema, loginSchema } = require('../validations/schemas');

const router = express.Router();

router.post('/signup', validationMiddleware(signupSchema), authController.signup);
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json({
      token: "dummy-token",
      user: user.rows[0]
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Server error" });
  }
});
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
