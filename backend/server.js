const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Import routes
const activityRoutes = require('./routes/activityRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
app.use('/api/activities', activityRoutes);
app.use('/api/activityLogs', activityLogRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || '', {}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
