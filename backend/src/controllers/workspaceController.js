import Workspace from '../models/Workspace.js';
import User from '../models/User.js';

export const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });

    const workspace = await Workspace.create({
      name: name.trim(),
      owner: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ members: req.user._id })
      .populate('owner', 'name email')
      .lean();
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    const workspace = await Workspace.findOne({ _id: req.params.id, owner: req.user._id });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const invitee = await User.findOne({ email });
    if (!invitee) return res.status(404).json({ message: 'User not found' });

    if (!workspace.members.includes(invitee._id)) {
      workspace.members.push(invitee._id);
      await workspace.save();
    }

    res.json({ message: 'Member invited', workspace });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};