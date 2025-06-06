/**
 * @file server.js
 * @description The entry point for the backend server.
 * Initializes the server and connects to the database.
 */

// It's a good practice to use a dotenv library to manage environment variables
require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models'); // Assuming models/index.js exports sequelize instance

const PORT = process.env.PORT || 5001;

/**
 * Starts the server after ensuring the database connection is established.
 */
const startServer = async () => {
  try {
    // Authenticate the database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // In development, you might want to sync the models with the database.
    // WARNING: { force: true } will drop and re-create all tables. Use with caution.
    if (process.env.NODE_ENV === 'development') {
      // await sequelize.sync({ alter: true }); // Use alter: true to update tables without dropping them
      console.log('Database synchronized in development mode.');
    }

    // Start listening for incoming requests
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Access it at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Unable to connect to the database or start the server:', error);
    process.exit(1); // Exit the process with an error code
  }
};

startServer();
