
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
