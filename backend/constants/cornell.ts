import { School, Gender } from '../types';

export const CORNELL_SCHOOLS: School[] = [
  'College of Agriculture and Life Sciences',
  'College of Architecture, Art, and Planning',
  'College of Arts and Sciences',
  'Cornell SC Johnson College of Business',
  'College of Engineering',
  'College of Human Ecology',
  'School of Industrial and Labor Relations',
  'Graduate School',
  'Law School',
  'Brooks School of Public Policy',
  'Weill Cornell Medical',
  'College of Veterinary Medicine',
  'Nolan School of Hotel Administration',
];

export const CORNELL_MAJORS: Record<School, string[]> = {
  'College of Agriculture and Life Sciences': [
    'Animal Science',
    'Atmospheric Science',
    'Biological Sciences',
    'Biometry and Statistics',
    'Communication',
    'Development Sociology',
    'Earth and Atmospheric Sciences',
    'Entomology',
    'Environmental and Sustainability Sciences',
    'Food Science',
    'Global Development',
    'Information Science',
    'Landscape Architecture',
    'Natural Resources',
    'Nutritional Sciences',
    'Plant Sciences',
    'Science of Earth Systems',
    'Viticulture and Enology',
  ],
  'College of Architecture, Art, and Planning': [
    'Architecture',
    'Art',
    'City and Regional Planning',
    'Landscape Architecture',
    'Urban and Regional Studies',
  ],
  'College of Arts and Sciences': [
    'Africana Studies',
    'American Studies',
    'Anthropology',
    'Archaeology',
    'Asian Studies',
    'Astronomy',
    'Biology',
    'Biology & Society',
    'Chemistry',
    'China and Asia-Pacific Studies',
    'Classics',
    'Cognitive Science',
    'College Scholar',
    'Comparative Literature',
    'Computer Science',
    'Economics',
    'English',
    'Feminist, Gender, and Sexuality Studies',
    'French',
    'German Studies',
    'Global & Public Health Sciences',
    'Government',
    'History',
    'History of Art',
    'Independent Major',
    'Information Science',
    'Italian',
    'Linguistics',
    'Mathematics',
    'Music',
    'Near Eastern Studies',
    'Performing and Media Arts',
    'Philosophy',
    'Physics',
    'Psychology',
    'Religious Studies',
    'Romance Studies',
    'Russian',
    'Science & Technology Studies',
    'Sociology',
    'Spanish',
    'Statistical Science',
    'Theater, Film, and Dance',
  ],
  'Cornell SC Johnson College of Business': [
    'Applied Economics and Management',
    'Hotel Administration',
    'Business (Dyson)',
    'Real Estate',
  ],
  'College of Engineering': [
    'Biomedical Engineering',
    'Chemical Engineering',
    'Civil Engineering',
    'Computer Science',
    'Electrical and Computer Engineering',
    'Engineering Physics',
    'Environmental Engineering',
    'Information Science, Systems, and Technology',
    'Materials Science and Engineering',
    'Mechanical Engineering',
    'Operations Research and Engineering',
  ],
  'College of Human Ecology': [
    'Design and Environmental Analysis',
    'Fiber Science and Apparel Design',
    'Global and Public Health Sciences',
    'Human Biology, Health, and Society',
    'Human Development',
    'Nutritional Sciences',
    'Policy Analysis and Management',
  ],
  'School of Industrial and Labor Relations': [
    'Industrial and Labor Relations',
  ],
  'Graduate School': [
    'Graduate Student - Arts and Sciences',
    'Graduate Student - Engineering',
    'Graduate Student - Business',
    'Graduate Student - Other',
    'PhD Candidate',
    "Master's Student",
  ],
  'Law School': ['Law (J.D.)', 'Law (LL.M.)', 'Law (J.S.D.)'],
  'Brooks School of Public Policy': [
    'Public Policy (MPA)',
    'Public Policy (PhD)',
  ],
  'Weill Cornell Medical': [
    'Medicine (M.D.)',
    'Medical Sciences (PhD)',
    'Physician Assistant Studies',
  ],
  'College of Veterinary Medicine': [
    'Veterinary Medicine (D.V.M.)',
    'Biomedical Sciences (PhD)',
    'Veterinary Graduate',
  ],
  'Nolan School of Hotel Administration': ['Hotel Administration'],
};

// Flattened list of all majors for easy selection
export const ALL_MAJORS = Object.values(CORNELL_MAJORS).flat().sort();

// Academic year classifications
export type Year =
  | 'Freshman'
  | 'Sophomore'
  | 'Junior'
  | 'Senior'
  | 'Graduate'
  | 'PhD'
  | 'Post-Doc';

export const YEARS: Year[] = [
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
  'Graduate',
  'PhD',
  'Post-Doc',
];

// Default preferences for new users
export const DEFAULT_PREFERENCES = {
  ageRange: { min: 18, max: 25 },
  years: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'] as Year[],
  schools: CORNELL_SCHOOLS,
  majors: [], // Empty means all majors
  genders: [] as Gender[], // User must set explicitly, originally in onboarding process
};
