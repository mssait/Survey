const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');

// GET /api/surveys — list all surveys with response counts
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, COUNT(r.id) as response_count
      FROM surveys s
      LEFT JOIN responses r ON s.id = r.survey_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching surveys:', err);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// POST /api/surveys — create survey with questions
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required').trim(),
    body('description').optional().trim(),
    body('questions').optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, questions = [] } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const surveyResult = await client.query(
        `INSERT INTO surveys (title, description) VALUES ($1, $2) RETURNING *`,
        [title, description || null]
      );
      const survey = surveyResult.rows[0];

      const insertedQuestions = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qResult = await client.query(
          `INSERT INTO questions (survey_id, question_text, question_type, options, is_required, order_index)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            survey.id,
            q.question_text,
            q.question_type,
            q.options ? JSON.stringify(q.options) : null,
            q.is_required || false,
            i,
          ]
        );
        insertedQuestions.push(qResult.rows[0]);
      }

      await client.query('COMMIT');
      res.status(201).json({ ...survey, questions: insertedQuestions });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating survey:', err);
      res.status(500).json({ error: 'Failed to create survey' });
    } finally {
      client.release();
    }
  }
);

// GET /api/surveys/:id — get survey with questions
router.get('/:id', async (req, res) => {
  try {
    const surveyResult = await pool.query('SELECT * FROM surveys WHERE id = $1', [req.params.id]);
    if (surveyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const questionsResult = await pool.query(
      'SELECT * FROM questions WHERE survey_id = $1 ORDER BY order_index ASC',
      [req.params.id]
    );

    res.json({ ...surveyResult.rows[0], questions: questionsResult.rows });
  } catch (err) {
    console.error('Error fetching survey:', err);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// PUT /api/surveys/:id — update survey (title, description, published, questions)
router.put(
  '/:id',
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty').trim(),
    body('description').optional().trim(),
    body('is_published').optional().isBoolean(),
    body('questions').optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, is_published, questions } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const surveyCheck = await client.query('SELECT * FROM surveys WHERE id = $1', [req.params.id]);
      if (surveyCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Survey not found' });
      }

      const current = surveyCheck.rows[0];
      const updatedTitle = title !== undefined ? title : current.title;
      const updatedDescription = description !== undefined ? description : current.description;
      const updatedPublished = is_published !== undefined ? is_published : current.is_published;

      const surveyResult = await client.query(
        `UPDATE surveys SET title = $1, description = $2, is_published = $3, updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [updatedTitle, updatedDescription, updatedPublished, req.params.id]
      );

      let insertedQuestions = [];
      if (questions !== undefined) {
        await client.query('DELETE FROM questions WHERE survey_id = $1', [req.params.id]);

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const qResult = await client.query(
            `INSERT INTO questions (survey_id, question_text, question_type, options, is_required, order_index)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [
              req.params.id,
              q.question_text,
              q.question_type,
              q.options ? JSON.stringify(q.options) : null,
              q.is_required || false,
              i,
            ]
          );
          insertedQuestions.push(qResult.rows[0]);
        }
      } else {
        const qResult = await client.query(
          'SELECT * FROM questions WHERE survey_id = $1 ORDER BY order_index ASC',
          [req.params.id]
        );
        insertedQuestions = qResult.rows;
      }

      await client.query('COMMIT');
      res.json({ ...surveyResult.rows[0], questions: insertedQuestions });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error updating survey:', err);
      res.status(500).json({ error: 'Failed to update survey' });
    } finally {
      client.release();
    }
  }
);

// DELETE /api/surveys/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM surveys WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    res.json({ message: 'Survey deleted successfully' });
  } catch (err) {
    console.error('Error deleting survey:', err);
    res.status(500).json({ error: 'Failed to delete survey' });
  }
});

// PATCH /api/surveys/:id/publish — toggle published state
router.patch('/:id/publish', async (req, res) => {
  try {
    const surveyCheck = await pool.query('SELECT * FROM surveys WHERE id = $1', [req.params.id]);
    if (surveyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const current = surveyCheck.rows[0];
    const result = await pool.query(
      `UPDATE surveys SET is_published = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [!current.is_published, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error toggling publish state:', err);
    res.status(500).json({ error: 'Failed to toggle publish state' });
  }
});

// GET /api/surveys/:id/results — aggregated results
router.get('/:id/results', async (req, res) => {
  try {
    const surveyResult = await pool.query('SELECT * FROM surveys WHERE id = $1', [req.params.id]);
    if (surveyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const questionsResult = await pool.query(
      'SELECT * FROM questions WHERE survey_id = $1 ORDER BY order_index ASC',
      [req.params.id]
    );

    const responseCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM responses WHERE survey_id = $1',
      [req.params.id]
    );
    const responseCount = parseInt(responseCountResult.rows[0].count, 10);

    const questionResults = [];
    for (const question of questionsResult.rows) {
      const answersResult = await pool.query(
        `SELECT a.* FROM answers a
         JOIN responses r ON a.response_id = r.id
         WHERE a.question_id = $1 AND r.survey_id = $2`,
        [question.id, req.params.id]
      );

      const answers = answersResult.rows;
      let aggregated = null;

      if (question.question_type === 'text') {
        aggregated = {
          type: 'text',
          answers: answers.map((a) => a.answer_text).filter(Boolean),
        };
      } else if (question.question_type === 'multiple_choice') {
        const counts = {};
        if (question.options) {
          for (const opt of question.options) {
            counts[opt] = 0;
          }
        }
        for (const answer of answers) {
          if (answer.answer_text) {
            counts[answer.answer_text] = (counts[answer.answer_text] || 0) + 1;
          }
        }
        aggregated = { type: 'multiple_choice', counts };
      } else if (question.question_type === 'checkbox') {
        const counts = {};
        if (question.options) {
          for (const opt of question.options) {
            counts[opt] = 0;
          }
        }
        for (const answer of answers) {
          if (answer.answer_options) {
            const opts = Array.isArray(answer.answer_options) ? answer.answer_options : [];
            for (const opt of opts) {
              counts[opt] = (counts[opt] || 0) + 1;
            }
          }
        }
        aggregated = { type: 'checkbox', counts };
      } else if (question.question_type === 'rating') {
        const ratings = answers
          .map((a) => parseInt(a.answer_text, 10))
          .filter((n) => !isNaN(n) && n >= 1 && n <= 5);
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const r of ratings) {
          distribution[r]++;
        }
        const average =
          ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : null;
        aggregated = { type: 'rating', average, distribution, count: ratings.length };
      }

      questionResults.push({
        ...question,
        aggregated,
        answer_count: answers.length,
      });
    }

    res.json({
      survey: surveyResult.rows[0],
      response_count: responseCount,
      questions: questionResults,
    });
  } catch (err) {
    console.error('Error fetching results:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

module.exports = router;
