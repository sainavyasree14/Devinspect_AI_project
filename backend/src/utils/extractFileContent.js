import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const SUPPORTED_EXTENSIONS = new Set([
  '.txt', '.docx', '.pdf',
  '.c', '.cpp', '.java', '.py', '.js', '.ts',
  '.jsx', '.tsx', '.html', '.css', '.json', '.xml',
  '.rb', '.go', '.rs', '.php', '.swift', '.kt',
]);

const REJECTED_EXTENSIONS = new Set([
  '.zip', '.rar', '.exe', '.bin', '.dll', '.so',
  '.tar', '.gz', '.7z', '.iso', '.dmg', '.apk',
]);

/**
 * Sanitize extracted text — strip null bytes, limit length, no script injection
 */
const sanitize = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\0/g, '')                          // null bytes
    .replace(/<script[\s\S]*?<\/script>/gi, '')  // script tags
    .replace(/javascript:/gi, '')                // js: URIs
    .trim()
    .slice(0, 200_000);                          // max 200k chars
};

/**
 * Extract readable text/code from an uploaded file.
 * Always deletes the temp file after extraction.
 *
 * @param {object} file  - multer file object
 * @returns {Promise<string>} clean extracted text
 */
export const extractFileContent = async (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const filePath = file.path;

  try {
    // Reject unsupported binary formats
    if (REJECTED_EXTENSIONS.has(ext)) {
      throw new Error(`Unsupported file format: ${ext}`);
    }

    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      throw new Error(`Unsupported file format: ${ext}. Allowed: .txt .docx .pdf .c .cpp .java .py .js`);
    }

    let text = '';

    if (ext === '.docx') {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      if (!text || text.trim().length === 0) {
        throw new Error('Document appears to be empty or could not be read.');
      }
    } else if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath);
      const result = await pdfParse(buffer);
      text = result.text;
      if (!text || text.trim().length === 0) {
        throw new Error('PDF appears to be empty or contains only images (no extractable text).');
      }
    } else {
      // Plain text / code files
      text = fs.readFileSync(filePath, 'utf-8');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('File is empty.');
    }

    return sanitize(text);
  } finally {
    // Always clean up temp file
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // ignore cleanup errors
    }
  }
};
