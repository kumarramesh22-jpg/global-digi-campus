export const EDUCATION_DATA = {
  India: {
    Telangana: {
      Hanamkonda: {
        'Kakatiya University': ['University Arts & Science College', 'Chaitanya Deemed to be University', 'Vaagdevi Degree & PG College', 'Other'],
        'JNTUH Affiliated': ['KITSW (Kakatiya Institute of Technology & Science)', 'SR University', 'Other'],
        Other: ['Other']
      },
      Warangal: {
        'Kakatiya University': ['KU Campus Colleges', 'Lal Bahadur College', 'Other'],
        'NIT Warangal': ['National Institute of Technology Warangal', 'Other'],
        Other: ['Other']
      },
      Hyderabad: {
        'Osmania University': ['University College of Commerce & Business Management', 'Nizam College', 'Other'],
        'JNTUH': ['JNTUH College of Engineering', 'CBIT', 'VNR VJIET', 'Other'],
        'Guru Nanak University': ['Guru Nanak Institutions', 'Other'],
        Other: ['Other']
      },
      Other: { Other: ['Other'] }
    },
    'Andhra Pradesh': {
      Visakhapatnam: { 'Andhra University': ['AU College of Engineering', 'Other'], Other: ['Other'] },
      Vijayawada: { 'Acharya Nagarjuna University': ['KL University', 'VR Siddhartha', 'Other'], Other: ['Other'] },
      Other: { Other: ['Other'] }
    },
    Maharashtra: {
      Mumbai: { 'University of Mumbai': ['St. Xavier’s College', 'NMIMS', 'IIT Bombay', 'Other'], Other: ['Other'] },
      Pune: { 'Savitribai Phule Pune University': ['Fergusson College', 'COEP', 'Symbiosis', 'Other'], Other: ['Other'] },
      Other: { Other: ['Other'] }
    },
    Karnataka: {
      Bengaluru: { 'Bangalore University': ['Christ University', 'RV College of Engineering', 'IISc', 'Other'], Other: ['Other'] },
      Other: { Other: ['Other'] }
    },
    Other: { Other: { Other: ['Other'] } }
  },
  'United States': { Other: { Other: { Other: ['Other'] } } },
  'United Kingdom': { Other: { Other: { Other: ['Other'] } } },
  Canada: { Other: { Other: { Other: ['Other'] } } },
  Other: { Other: { Other: { Other: ['Other'] } } }
};

export const ADMIN_MOBILE = '9963088662';

export const GLOBAL_STORIES = [
  { id: "s1", name: "Global Welcome", college: "Oxford • UK", badge: "🌍", color: "from-pink-500 to-amber-500", text: "Welcome students from 50+ countries! Share your notes & projects." },
  { id: "s2", name: "MBA & Research", college: "Kakatiya Univ • IN", badge: "📊", color: "from-indigo-500 to-cyan-500", text: "Operations Research & Case Study notes uploaded in Feed!" },
  { id: "s3", name: "Junior Science", college: "St. Jude High • US", badge: "🔬", color: "from-emerald-500 to-teal-500", text: "Class 10 Physics & Coding quiz live now in Games tab!" },
  { id: "s4", name: "AI & Coding", college: "MIT Open • Global", badge: "💻", color: "from-purple-500 to-pink-500", text: "Build your final year project report in minutes!" },
];

export const STARTER_GLOBAL_POSTS = [
  {
    id: "starter-1",
    authorName: "Sarah Jenkins",
    authorCollege: "University of London • UK",
    authorCourse: "MSc Data Science",
    isVerified: true,
    category: "notes",
    title: "Complete Python & Machine Learning Cheatsheet (2026 Edition)",
    content: "Hey global peers! Sharing my summarized exam revision notes covering Pandas, NumPy, and Neural Networks. Feel free to save or share with your study group! #DataScience #GlobalNotes",
    likes: 142,
    commentsCount: 28,
    timeAgo: "2h ago",
  },
  {
    id: "starter-2",
    authorName: "Aarav Sharma",
    authorCollege: "Delhi Public School • India",
    authorCourse: "Class 10 • Science",
    isVerified: true,
    category: "games",
    title: "Can you beat my score in the Global Maths & Logic Challenge?",
    content: "Just scored 95% in the Junior Zone quick quiz! Looking for study buddies preparing for Olympiads and board exams. #SchoolLife #MathChallenge",
    likes: 89,
    commentsCount: 19,
    timeAgo: "4h ago",
  },
  {
    id: "starter-3",
    authorName: "Kenji Takahashi",
    authorCollege: "University of Tokyo • Japan",
    authorCourse: "B.Tech Robotics",
    isVerified: true,
    category: "project",
    title: "Looking for 2 teammates for Global Smart Campus Hackathon",
    content: "Building an AI study planner that translates lecture notes into any language. Need a frontend designer and a presenter! DM me in Chat. #Hackathon #GlobalPeers",
    likes: 215,
    commentsCount: 44,
    timeAgo: "6h ago",
  },
];
