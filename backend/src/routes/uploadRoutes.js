import express from 'express';
import multer from 'multer';
import path from 'path';
import { extractFileContent } from '../utils/extractFileContent.js';

const router = express.Router();

const ALLOWED_EXTENSIONS = new Set([
  '.txt', '.docx', '.pdf',
  '.c', '.cpp', '.java', '.py', '.js', '.ts',
  '.jsx', '.tsx', '.html', '.css', '.json', '.xml',
  '.rb', '.go', '.rs', '.php', '.swift', '.kt',
]);

const REJECTED_EXTENSIONS = new Set([
  '.zip', '.rar', '.exe', '.bin', '.dll', '.so',
  '.tar', '.gz', '.7z', '.iso', '.dmg', '.apk',
]);

// Multer storage — temp disk storage, cleaned up after extraction
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (REJECTED_EXTENSIONS.has(ext)) {
    return cb(new Error(`Rejected file format: ${ext}. Executables and archives are not allowed.`));
  }
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`Unsupported file format: ${ext}. Allowed: .txt .docx .pdf .c .cpp .java .py .js and more.`));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

/**
 * POST /api/upload
 * Accepts one or more files, extracts clean text, returns array of { name, content }
 */
router.post('/', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    const results = await Promise.all(
      req.files.map(async (file) => {
        try {
          const content = await extractFileContent(file);
          return { name: file.originalname, content, success: true };
        } catch (err) {
          return { name: file.originalname, content: '', success: false, error: err.message };
        }
      })
    );

    const successful = results.filter(r => r.success);
    const failed     = results.filter(r => !r.success);

    if (successful.length === 0) {
      return res.status(422).json({
        success: false,
        message: failed[0]?.error || 'All files failed to extract.',
        errors: failed,
      });
    }

    return res.json({
      success: true,
      files: successful.map(r => ({ name: r.name, content: r.content })),
      warnings: failed.length > 0 ? failed : undefined,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Multer error handler (file size, filter rejections)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'File exceeds maximum size of 5MB.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

export default router;
