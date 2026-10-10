import User from '../models/User.js';
import Election from '../models/Election.js';

export const seedDatabase = async () => {
  try {
    // Check if demo admin exists
    const adminExists = await User.findOne({ email: 'admin@votesphere.demo' });
    const voterExists = await User.findOne({ email: 'jane@votesphere.demo' });

    if (adminExists && voterExists) {
      console.log('✓ Demo data already seeded');
      return;
    }

    // Create demo users
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: 'admin@votesphere.demo',
        password: 'admin123',
        role: 'admin',
        isVerified: true
      });
      console.log('✓ Admin user created');
    }

    if (!voterExists) {
      await User.create({
        name: 'Jane Carter',
        email: 'jane@votesphere.demo',
        password: 'voter123',
        role: 'voter',
        isVerified: true
      });
      console.log('✓ Demo voter created');
    }

    // Create demo elections
    const electionsCount = await Election.countDocuments();
    if (electionsCount === 0) {
      const admin = await User.findOne({ role: 'admin' });
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await Election.insertMany([
        {
          title: 'Student Council 2026',
          description: 'Choose the next student council leaders for campus representation.',
          category: 'Campus Election',
          status: 'open',
          startDate: now,
          endDate: tomorrow,
          candidates: [
            { id: 'c-1', name: 'Olivia James', party: 'Future Leaders', symbol: '🌱', votes: 420 },
            { id: 'c-2', name: 'Daniel Kim', party: 'Unity Bloc', symbol: '⚑', votes: 390 },
            { id: 'c-3', name: 'Nora Patel', party: 'Student Voice', symbol: '✦', votes: 275 }
          ],
          createdBy: admin._id,
          totalVoters: 1870
        },
        {
          title: 'City Development Fund',
          description: 'Vote for the town development proposal and project committee.',
          category: 'Public Policy',
          status: 'closed',
          startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          candidates: [
            { id: 'c-4', name: 'Mila Brooks', party: 'Green Growth', symbol: '🌿', votes: 520 },
            { id: 'c-5', name: 'Samuel Lee', party: 'Urban Future', symbol: '🏙', votes: 310 },
            { id: 'c-6', name: 'Ethan Gray', party: 'Community First', symbol: '🤝', votes: 290 }
          ],
          published: true,
          winner: 'Mila Brooks',
          createdBy: admin._id,
          totalVoters: 1200
        },
        {
          title: 'University Research Committee',
          description: 'Select committee members to represent research and innovation programs.',
          category: 'Academic Board',
          status: 'upcoming',
          startDate: nextWeek,
          endDate: new Date(nextWeek.getTime() + 13 * 24 * 60 * 60 * 1000),
          candidates: [
            { id: 'c-7', name: 'Priya Shah', party: 'Innovation Network', symbol: '🧪', votes: 0 },
            { id: 'c-8', name: 'Lucas Moore', party: 'Research Forward', symbol: '📚', votes: 0 },
            { id: 'c-9', name: 'Harper Stone', party: 'Scholar Alliance', symbol: '🎓', votes: 0 }
          ],
          createdBy: admin._id,
          totalVoters: 950
        }
      ]);
      console.log('✓ Demo elections created');
    }
  } catch (error) {
    console.error('✗ Seed error:', error.message);
  }
};
