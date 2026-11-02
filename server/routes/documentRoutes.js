const express = require('express');
const router = express.Router();
const {
  getDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  getDocumentReadiness
} = require('../controllers/documentController');
const { protect, requireStudent } = require('../middleware/authMiddleware');

router.use(protect, requireStudent);

router.get('/', getDocuments);
router.post('/', addDocument);
router.get('/readiness/:schemeId', getDocumentReadiness);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
