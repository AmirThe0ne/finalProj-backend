const mongoose = require('mongoose');
const Faq = require('../models/Faq.model');

exports.getFaqs = async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ order: 1, createdAt: 1 });
    return res.status(200).json(faqs);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to get FAQs' });
  }
};

exports.createFaq = async (req, res) => {
  try {
    const question = typeof req.body.question === 'string' ? req.body.question.trim() : '';
    const answer = typeof req.body.answer === 'string' ? req.body.answer.trim() : '';
    if (!question || !answer) return res.status(400).json({ message: 'Question and answer are required' });
    const faq = await Faq.create({ question, answer, order: Number(req.body.order || 0) });
    return res.status(201).json(faq);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.updateFaq = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid FAQ ID' });
    const updates = {};
    if (typeof req.body.question === 'string') updates.question = req.body.question.trim();
    if (typeof req.body.answer === 'string') updates.answer = req.body.answer.trim();
    if (req.body.order !== undefined) updates.order = Number(req.body.order);
    if (!updates.question || !updates.answer) return res.status(400).json({ message: 'Question and answer are required' });
    const faq = await Faq.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    return res.status(200).json(faq);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.deleteFaq = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid FAQ ID' });
    const faq = await Faq.findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    return res.status(200).json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete FAQ' });
  }
};
