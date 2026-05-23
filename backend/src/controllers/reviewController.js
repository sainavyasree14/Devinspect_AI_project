import { analyzeContent } from '../services/aiService.js';

export const reviewCode = async (req, res) => {
    try {
        const { code, mode } = req.body;

        const result = await analyzeContent(code, mode);

        return res.json({
            success: true,
            originalCode: code,
            correctedCode: result.correctedCode || '',
            explanation: result.explanation || '',
            modeOutput: result.modeOutput || '',
            errors: result.errors || [],
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};