/**
 * @file app.js
 * @description Main Express application setup file.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const ApiError = require('./utils/ApiError');
const errorHandler = require('./middlewares/errorHandler.middleware');
const authRoutes = require('./api/v1/auth.routes');
const caseRoutes = require('./api/v1/cases.routes.js');
const practiceSessionRoutes = require('./api/v1/practiceSessions.routes.js');
const mockExamRoutes = require('./api/v1/mockExams.routes.js');
const myNotesRoutes = require('./api/v1/myNotes.routes.js'); // Import my-notes routes

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/health', (req, res) => res.status(200).send('OK'));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/scenarios', caseRoutes);
app.use('/api/v1/practice-sessions', practiceSessionRoutes);
app.use('/api/v1/mock-exams', mockExamRoutes);
app.use('/api/v1/my-notes', myNotesRoutes); // Mount my-notes routes

app.use((req, res, next) => next(new ApiError(404, 'C001_RESOURCE_NOT_FOUND', 'Not found')));
app.use(errorHandler);

module.exports = app;
