import express from 'express';
import Election from '../models/Election.js';
import Vote from '../models/Vote.js';
import { protect, authorize } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// Get all elections
router.get('/', async (req, res) => {
  try {
    const elections = await Election.find().populate('createdBy', 'name email');
    res.json({
      success: true,
      count: elections.length,
      data: elections
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single election
router.get('/:id', async (req, res) => {
  try {
    const election = await Election.findById(req.params.id).populate('createdBy', 'name email');
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }
    res.json({
      success: true,
      data: election
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create election (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, description, category, startDate, endDate, candidates } = req.body;

    if (!title || !description || !category || !startDate || !endDate || !candidates) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Add IDs to candidates if not present
    const candidatesWithIds = candidates.map((c, i) => ({
      id: c.id || `c-${Date.now()}-${i}`,
      name: c.name,
      party: c.party || 'Independent',
      symbol: c.symbol || '★',
      votes: 0
    }));

    const election = await Election.create({
      title,
      description,
      category,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      candidates: candidatesWithIds,
      createdBy: req.user._id,
      status: new Date(startDate) <= new Date() ? 'open' : 'upcoming'
    });

    // Log action
    await AuditLog.create({
      action: 'ELECTION_CREATED',
      userId: req.user._id,
      electionId: election._id,
      details: `Election '${title}' created by ${req.user.name}`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: election
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update election (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    let election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    // Prevent editing after election has started
    if (election.status === 'open') {
      return res.status(400).json({ error: 'Cannot edit an election that is already open' });
    }

    const updates = req.body;
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    election = await Election.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    await AuditLog.create({
      action: 'ELECTION_UPDATED',
      userId: req.user._id,
      electionId: election._id,
      details: `Election '${election.title}' updated`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: election
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish results (admin only)
router.put('/:id/publish', protect, authorize('admin'), async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    if (!election.status === 'closed') {
      return res.status(400).json({ error: 'Can only publish results for closed elections' });
    }

    // Find winner
    const winner = election.candidates.reduce((prev, current) =>
      prev.votes > current.votes ? prev : current
    );

    election.published = true;
    election.winner = winner.name;
    await election.save();

    await AuditLog.create({
      action: 'RESULT_PUBLISHED',
      userId: req.user._id,
      electionId: election._id,
      details: `Results for '${election.title}' published. Winner: ${winner.name}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: election
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle election status (admin only)
router.put('/:id/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    if (election.status === 'upcoming') {
      election.status = 'open';
    } else if (election.status === 'open') {
      election.status = 'closed';
    }

    await election.save();

    res.json({
      success: true,
      data: election
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get election statistics (admin only)
router.get('/:id/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    const votes = await Vote.countDocuments({ electionId: req.params.id });
    const totalVoters = await Vote.distinct('userId', { electionId: req.params.id });

    res.json({
      success: true,
      data: {
        electionTitle: election.title,
        totalCandidates: election.candidates.length,
        totalVotes: votes,
        totalVoters: totalVoters.length,
        participationRate: `${((totalVoters.length / election.totalVoters) * 100 || 0).toFixed(2)}%`,
        candidates: election.candidates.map(c => ({
          name: c.name,
          party: c.party,
          votes: c.votes,
          percentage: `${((c.votes / votes) * 100 || 0).toFixed(2)}%`
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
