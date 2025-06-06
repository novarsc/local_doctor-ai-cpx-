/**
 * @file gemini.config.js
 * @description Loads Gemini AI configuration from environment variables.
 */

// Load environment variables from .env file
require('dotenv').config();

const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY,
};

// Check if the API key is provided
if (!geminiConfig.apiKey) {
  console.warn('Gemini API key is not defined in the .env file. AI-related features will not work.');
}

module.exports = geminiConfig;
