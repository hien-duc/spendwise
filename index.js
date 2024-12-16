require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const authenticateUser = require("./middleware/auth");

// Import routes
const transactionsRouter = require("./routes/transactions");
const categoriesRouter = require("./routes/categories");
const reportsRouter = require("./routes/reports");
const profilesRouter = require("./routes/profiles");
const otherRouter = require("./routes/other");
const financialGoalsRouter = require("./routes/financial_goals");
const fixedCostsRouter = require("./routes/fixed_costs");
const periodicIncomeRouter = require("./routes/periodic_income");
const fixedInvestmentsRouter = require("./routes/fixed_investments");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "SpendWise API Documentation",
  })
);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Auth middleware
app.use(async (req, res, next) => {
  // Skip auth for Swagger docs and OTP routes
  if (req.path === "/api-docs" || req.path.startsWith("/api-docs/")) {
    return next();
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error) throw error;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

// Protected API routes
app.use(["/api/transactions"], authenticateUser, transactionsRouter);
app.use("/api/categories", authenticateUser, categoriesRouter);
app.use("/api/reports", authenticateUser, reportsRouter);
app.use("/api/profiles", authenticateUser, profilesRouter);
app.use("/api/other", authenticateUser, otherRouter);
app.use(
  "/api/financial/financial-goals",
  authenticateUser,
  financialGoalsRouter
);
app.use("/api/financial/fixed-costs", authenticateUser, fixedCostsRouter);
app.use(
  "/api/financial/periodic-income",
  authenticateUser,
  periodicIncomeRouter
);
app.use(
  "/api/financial/fixed-investments",
  authenticateUser,
  fixedInvestmentsRouter
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `API Documentation available at http://localhost:${PORT}/api-docs`
  );
});
