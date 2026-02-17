
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
  id: string; // Prisma uses Int usually but let's check. Schema implies Int often but let's stick to string if unsure or handle both
  email: string;
  role: UserRole;
  firebase_uid?: string;
  phone?: string;
  is_verified?: boolean;
  avatar?: string; // Derived from consultant profile if needed
}

export interface Consultant {
  id: number;
  userId: number;
  type: string;
  domain: string;
  bio: string | null;
  languages: string | null;
  hourly_price: number;
  is_verified: boolean;
  profile_pic?: string;
  user?: {
    email: string;
  };
  // UI helper props
  name?: string; // Often derived from user email or profile
  rating?: number; // Not yet in backend
  image?: string; // Mapped from profile_pic
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
