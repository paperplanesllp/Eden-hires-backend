const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

const contactRoutes = require("./routes/contactRoutes");
const jobRoutes = require("./routes/jobRoutes");
const { verifyTransporter } = require("./utils/sendEmail");

dotenv.config();

const app = express();

connectDB();

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://eden-hires.vercel.app",
  "https://edenhire.ai",
  "https://www.edenhire.ai",
];

const envAllowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS || "").split(","),
]
  .map((origin) => origin && origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

console.log("Allowed CORS origins:", allowedOrigins);

app.use(cors(corsOptions));
app.options("/*", cors(corsOptions));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} Origin: ${req.headers.origin}`);
  next();
});
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Edenhire.ai API Running");
});
app.use("/api/contact", contactRoutes);
app.use("/api/job", jobRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Verify SMTP transporter at startup to surface email auth issues early
  verifyTransporter()
    .then(() => console.log("SMTP verification succeeded"))
    .catch((err) => console.error("SMTP verification failed:", err));
});
