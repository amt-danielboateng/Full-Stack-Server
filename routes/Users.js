const express = require("express");
const router = express.Router();
const { Users } = require("../models");
const bcrypt = require("bcryptjs");
const { sign } = require("jsonwebtoken");
const { validateToken } = require("../middlewares/AuthMiddleware");


router.post("/", async (req, res) => {
  const { username, password } = req.body;
  bcrypt.hash(password, 10, async (err, hash) => {
    if (err) {
      console.log(err);
    }
    Users.create({ username: username, password: hash });
  });
  res.json("SUCCESS");
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await Users.findOne({ where: { username: username } });

  if (!user) return res.json({ error: "User not found" });

  bcrypt.compare(password, user.password).then((match) => {
    if (!match) return res.json({ error: "Wrong Username And Password Combination" });
    const accessToken = sign({ username: user.username, id: user.id }, "secret");
    res.json({token:accessToken, username: user.username, id: user.id});
  });
});

router.get("/auth", validateToken, async (req, res) => {
  res.json(req.user);
});

router.get("/basicinfo/:id", async (req, res) => {
  const id = req.params.id;
  const basicInfo = await Users.findByPk(id, {
    attributes: { exclude: ["password"] },
  });
  res.json(basicInfo);
});

router.post("/changepassword", validateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await Users.findOne({ where: { username: req.user.username } });
    const match = await bcrypt.compare(oldPassword, user.password);
    
    if (!match) {
      return res.json({ error: "Wrong Password Entered" });
    }
    
    const hash = await bcrypt.hash(newPassword, 10);
    await Users.update({ password: hash }, { where: { username: req.user.username } });
    res.json("SUCCESS");
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
