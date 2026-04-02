const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');

// POST /api/responses — submit a response
router.post(
  '/',
  [
    body('survey_id').notEmpty().withMessage('survey_id is required'),
    body('answers').isArray({ min: 0 }).withMessage('answers must be an array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { survey_id, answers = [] } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check survey exists and is published
      const surveyCheck = await client.query('SELECT * FROM surveys WHERE id = $1', [survey_id]);
      if (surveyCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Survey not found' });
      }

      if (!surveyCheck.rows[0].is_published) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Survey is not published' });
      }

      // Check required questions are answered
      const questionsResult = await client.query(
        'SELECT * FROM questions WHERE survey_id = $1',
        [survey_id]
      );
      const requiredQuestions = questionsResult.rows.filter((q) => q.is_required);
      const answeredQuestionIds = new Set(answers.map((a) => a.question_id));

      for (const req_q of requiredQuestions) {
        if (!answeredQuestionIds.has(req_q.id)) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: `Required question "${req_q.question_text}" is not answered`,
          });
        }
        const answer = answers.find((a) => a.question_id === req_q.id);
        if (answer) {
          const hasText = answer.answer_text && answer.answer_text.trim() !== '';
          const hasOptions =
            answer.answer_options && Array.isArray(answer.answer_options) && answer.answer_options.length > 0;
          if (!hasText && !hasOptions) {
            await client.query('ROLLBACK');
            return res.status(400).json({
              error: `Required question "${req_q.question_text}" is not answered`,
            });
          }
        }
      }

      // Create response record
      const responseResult = await client.query(
        'INSERT INTO responses (survey_id) VALUES ($1) RETURNING *',
        [survey_id]
      );
      const response = responseResult.rows[0];

      // Insert answers
      for (const answer of answers) {
        await client.query(
          `INSERT INTO answers (response_id, question_id, answer_text, answer_options)
           VALUES ($1, $2, $3, $4)`,
          [
            response.id,
            answer.question_id,
            answer.answer_text || null,
            answer.answer_options ? JSON.stringify(answer.answer_options) : null,
          ]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ message: 'Response submitted successfully', response_id: response.id });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error submitting response:', err);
      res.status(500).json({ error: 'Failed to submit response' });
    } finally {
      client.release();
    }
  }
);

// GET /api/responses/survey/:surveyId — get all responses for a survey
router.get('/survey/:surveyId', async (req, res) => {
  try {
    const surveyCheck = await pool.query('SELECT * FROM surveys WHERE id = $1', [req.params.surveyId]);
    if (surveyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const responsesResult = await pool.query(
      'SELECT * FROM responses WHERE survey_id = $1 ORDER BY submitted_at DESC',
      [req.params.surveyId]
    );

    const responsesWithAnswers = [];
    for (const response of responsesResult.rows) {
      const answersResult = await pool.query(
        'SELECT * FROM answers WHERE response_id = $1',
        [response.id]
      );
      responsesWithAnswers.push({ ...response, answers: answersResult.rows });
    }

    res.json(responsesWithAnswers);
  } catch (err) {
    console.error('Error fetching responses:', err);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

module.exports = router;
