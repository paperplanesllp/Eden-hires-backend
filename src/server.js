const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

const contactRoutes = require("./routes/contactRoutes");
const jobRoutes = require("./routes/jobRoutes");

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Edenhire.ai API Running");
});

app.use("/api/contact", contactRoutes);
app.use("/api/job", jobRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});