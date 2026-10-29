const mongoose = require('mongoose');
const Testimonial = require('../models/Testimonial.model');
const User = require('../models/User.model');

exports.createTestimonial = async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    if (!text || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Text and a rating from 1 to 5 are required' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const testimonial = await Testimonial.create({
      user: user._id,
      name: user.name,
      text,
      rating,
      status: 'pending'
    });
    return res.status(201).json({ message: 'Thanks, your review is awaiting approval', testimonial });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.getApprovedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ status: 'approved' }).sort({ createdAt: -1 });
    return res.status(200).json(testimonials);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to get testimonials' });
  }
};

exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    return res.status(200).json(testimonials);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to get testimonials' });
  }
};

exports.updateTestimonialStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid testimonial ID' });
    if (!['approved', 'rejected'].includes(req.body.status)) return res.status(400).json({ message: 'Status must be approved or rejected' });
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
    return res.status(200).json(testimonial);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
