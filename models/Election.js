import mongoose from 'mongoose';

const electionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an election title'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Campus Election', 'Public Policy', 'Academic Board', 'Community Vote', 'Other']
  },
  status: {
    type: String,
    enum: ['upcoming', 'open', 'closed'],
    default: 'upcoming'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  candidates: [{
    id: String,
    name: {
      type: String,
      required: true
    },
    party: String,
    symbol: String,
    votes: {
      type: Number,
      default: 0
    }
  }],
  published: {
    type: Boolean,
    default: false
  },
  winner: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalVoters: {
    type: Number,
    default: 0
  },
  participationRate: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Election = mongoose.model('Election', electionSchema);
export default Election;
