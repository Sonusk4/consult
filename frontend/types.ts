
export enum UserRole {
  USER = 'USER',
  CONSULTANT = 'CONSULTANT',
  ENTERPRISE_ADMIN = 'ENTERPRISE_ADMIN',
  ENTERPRISE_MEMBER = 'ENTERPRISE_MEMBER',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN'
}

export enum SessionStatus {
  UPCOMING = 'UPCOMING',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: string; // Keeping as string for frontend compatibility, backend handles Int conversion
  email: string;
  role: UserRole;
  firebase_uid?: string;
  phone?: string | null;
  is_verified?: boolean;
  avatar?: string;
  name?: string;
  bio?: string | null;
  expertise?: string[] | string | null;
  availability?: any;
  profile_photo?: string | null;
  profile_pic?: string | null;
  designation?: string | null;
  verification_status?: string | null;
  enterpriseId?: number | null;
  location?: string | null;
  profile?: {
    avatar?: string | null;
    bio?: string | null;
    location?: string | null;
    headline?: string | null;
    languages?: string | null;
    expertise?: any | null;
    hourly_rate?: number | null;
    availability?: string | null;
    designation?: string | null;
    years_experience?: number | null;
    education?: string | null;
  };
}

export interface Consultant {
  id: number;
  userId: number;
  type: string | null;
  domain: string | null;
  bio: string | null;
  languages: string | null;
  hourly_price: number | null;
  is_verified: boolean;
  profile_pic?: string | null;
  rating: number;
  total_reviews: number;
  availability?: any;
  user?: {
    email: string;
  };
  // UI helper props (can be derived)
  name?: string;
  image?: string;
}

export interface Booking {
  id: number;
  userId: number;
  consultantId: number;
  date: string; // ISO string
  time_slot: string;
  status: string;
  payment_status?: string;
  meeting_link?: string;
  consultant?: Consultant;
  price?: number;
  type?: string;
  user?: User;
  review?: any;
  chat_started?: boolean;
  is_paid?: boolean;
}

export interface Session {
  id: string;
  partnerName: string;
  domain: string;
  startTime: string;
  type: string;
  status: SessionStatus;
  price: number;
}
