import express from 'express';
import Vote from '../models/Vote.js';
import Election from '../models/Election.js';
import { protect } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// Cast a vote
router.post('/', protect, async (req, res) => {
  try {
    const { electionId, candidateId } = req.body;

    if (!electionId || !candidateId) {
      return res.status(400).json({ error: 'Please provide electionId and candidateId' });
    }

    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    if (election.status !== 'open') {
      return res.status(400).json({ error: 'This election is not open for voting' });
    }

    // Check if user already voted
    const existingVote = await Vote.findOne({
      userId: req.user._id,
      electionId: electionId
    });

    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted in this election' });
    }

    // Verify candidate exists
    const candidate = election.candidates.find(c => c.id === candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Create vote
    const vote = await Vote.create({
      userId: req.user._id,
      electionId: electionId,
      candidateId: candidateId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Update candidate vote count
    const candidateIndex = election.candidates.findIndex(c => c.id === candidateId);
    election.candidates[candidateIndex].votes += 1;
    await election.save();

    // Log action
    await AuditLog.create({
      action: 'VOTE_CAST',
      userId: req.user._id,
      electionId: electionId,
      details: `Vote cast for election '${election.title}'`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Vote submitted successfully',
      data: {
        voteId: vote._id,
        candidateName: candidate.name,
        timestamp: vote.timestamp
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if user has voted in an election
router.get('/check/:electionId', protect, async (req, res) => {
  try {
    const hasVoted = await Vote.findOne({
      userId: req.user._id,
      electionId: req.params.electionId
    });

    res.json({
      success: true,
      hasVoted: !!hasVoted
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's voting history
router.get('/history', protect, async (req, res) => {
  try {
    const votes = await Vote.find({ userId: req.user._id })
      .populate('electionId', 'title status')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      count: votes.length,
      data: votes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
