const express = require("express");
const multer = require("multer");
const router = express.Router();

const { createJob } = require("../controllers/jobController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/", upload.single("resume"), createJob);

module.exports = router;
