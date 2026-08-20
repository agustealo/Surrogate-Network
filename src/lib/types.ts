
export type SurrogateCategory = 'personal' | 'utilitarian_business' | 'casual';
export type Boundary = 'platonic' | 'romantic' | 'physical' | 'virtual' | 'one-off' | 'recurring';

export interface Offering {
  id: string;
  title: string;
  description: string;
  category: SurrogateCategory;
  averageRating?: number;
  ratingCount?: number;
  boundaries?: Boundary[];
  tokenReward?: number;
}

export interface Request {
  id: string;
  title: string;
  description: string;
  category: SurrogateCategory;
  tags?: string[];
  averageRating?: number;
  ratingCount?: number;
  boundaries?: Boundary[];
  tokenCost?: number;
}

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  tokenBalance?: number;
}

export interface ProfileBadge {
  id: string;
  name: string;
  iconUrl?: string; // Can be a name of a Lucide icon or a URL to an image
  description?: string;
}

export interface StrengthMatrixPoint {
  attribute: string;
  proficiency: number;
}

export interface ReviewSummaryPoint {
  rating: string; // e.g., "5 Stars", "4 Stars"
  count: number;
}

export interface Profile extends User {
  bio: string;
  offerings: Offering[];
  requests: Request[];
  matchScore?: number;
  portfolioUrl?: string;
  videoIntroUrl?: string;
  badges?: ProfileBadge[];
  createdAt: string;
  strengthMatrix?: StrengthMatrixPoint[];
  reviewSummary?: ReviewSummaryPoint[];
}

// Ensure embedded arrays are plain objects for database compatibility
export type NewProfileData = Omit<Profile, 'id' | 'createdAt'>;


export interface Feedback {
  punctuality: number;
  reliability: number;
  communicationClarity: number;
  comments?: string;
  skillEndorsements?: string;
}

export type FeedContentType = 'post' | 'video' | 'livestream' | 'shared_need';

export interface FeedItem {
  id: string;
  user: User;
  createdAt: string;
  contentType: FeedContentType;
  textContent?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  dataAiHint?: string;
  likes: number;
  commentsCount: number;
  relatedNeedId?: string;
  relatedNeedTitle?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  lastMessage: string;
  unreadCount: number;
  avatarUrl?: string;
  timestamp: string;
  interactionFocus?: 'offering' | 'seeking' | 'mutual';
  offerings?: Pick<Offering, 'id' | 'title' | 'category'>[]; // Offerings relevant to chat preview
}

export interface Proposal {
  id: string;
  proposingUser: User;
  theirOffering: Pick<Offering, 'id' | 'title' | 'category'>;
  forYourRequest: Pick<Request, 'id' | 'title' | 'category'>;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  message?: string;
}

export interface ActiveConnection {
    id: string;
    partner: User;
    yourOffering: Pick<Offering, 'id' | 'title' | 'category'>;
    theirOffering: Pick<Offering, 'id' | 'title' | 'category'>;
    startedAt: string;
    status: 'active' | 'completed' | 'archived';
}
