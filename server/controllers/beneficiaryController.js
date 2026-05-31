import Beneficiary from '../models/Beneficiary.js';

export const getBeneficiaries = async (req, res) => {
  const list = await Beneficiary.find({ userId: req.user._id });
  res.json(list);
};

export const addBeneficiary = async (req, res) => {
  try {
    const { name, phone, nickname } = req.body;
    const b = await Beneficiary.create({ userId: req.user._id, name, phone, nickname });
    res.status(201).json(b);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteBeneficiary = async (req, res) => {
  await Beneficiary.findByIdAndDelete(req.params.id);
  res.json({ message: 'Removed' });
};
