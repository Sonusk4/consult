
import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  TrendingUp,
  Settings,
  MessageSquare,
  Search,
  Calendar,
  CreditCard,
  ShieldCheck,
  Briefcase,
  HelpCircle,
  LogOut,
  CalendarDays,
  Wallet,
  LifeBuoy,
  Star,
  User,
  Video,
  DollarSign,

} from 'lucide-react';

import { UserRole, SessionStatus, Session, Consultant } from './types';


export const MOCK_USER = {
  id: 'u1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  role: UserRole.USER,
  credits: 1250,
  avatar: 'https://picsum.photos/seed/alex/200'
};

export const MOCK_CONSULTANT_PROFILE = {
  id: 'c1',
  name: 'Dr. Sarah Smith',
  email: 'sarah@legal.com',
  role: UserRole.CONSULTANT,
  credits: 0,
  avatar: 'https://picsum.photos/seed/sarah/200'
};

export const MOCK_ENTERPRISE_STATS = {
  companyName: "TechVanguard Solutions",
  teamSize: 24,
  activeProjects: 8,
  monthlyRevenue: 45200,
  pendingVerifications: 3
};

export const MOCK_SESSIONS: Session[] = [
  {
    id: 's1',
    partnerName: 'Dr. Sarah Smith',
    domain: 'Legal & Compliance',
    startTime: 'Today, 2:00 PM',
    type: 'Video',
    status: SessionStatus.LIVE,
    price: 150
  },
  {
    id: 's2',
    partnerName: 'Mark Verdon',
    domain: 'Software Architecture',
    startTime: 'Tomorrow, 10:30 AM',
    type: 'Video',
    status: SessionStatus.UPCOMING,
    price: 200
  },
  {
    id: 's3',
    partnerName: 'Jessica Lee',
    domain: 'Financial Planning',
    startTime: '24 Oct, 4:00 PM',
    type: 'Audio',
    status: SessionStatus.COMPLETED,
    price: 100
  },
  {
    id: 's4',
    partnerName: 'Enterprise Team Beta',
    domain: 'System Audit',
    startTime: 'Friday, 1:00 PM',
    type: 'Chat',
    status: SessionStatus.UPCOMING,
    price: 500
  }
];

export const TOP_CONSULTANTS: Consultant[] = [
  {
    id: 1,
    userId: 101,
    name: 'Robert Fox',
    domain: 'Tech Strategy',
    rating: 4.9,
    hourly_price: 150,
    type: 'Individual',
    bio: '15+ years experience in scaling SaaS startups and engineering leadership.',
    image: 'https://picsum.photos/seed/robert/300',
    profile_pic: 'https://picsum.photos/seed/robert/300',
    is_verified: true,
    languages: 'English, French',
    total_reviews: 127,
    user: { email: 'robert@example.com' }
  },
  {
    id: 2,
    userId: 102,
    name: 'Annette Black',
    domain: 'Legal Counsel',
    rating: 4.8,
    hourly_price: 250,
    type: 'Individual',
    bio: 'Specialist in IP law and international business compliance.',
    image: 'https://picsum.photos/seed/annette/300',
    profile_pic: 'https://picsum.photos/seed/annette/300',
    is_verified: true,
    languages: 'English, Spanish',
    total_reviews: 89,
    user: { email: 'annette@example.com' }
  },
  {
    id: 3,
    userId: 103,
    name: 'Jane Cooper',
    domain: 'Healthcare Management',
    rating: 5.0,
    hourly_price: 300,
    type: 'Individual',
    bio: 'Former hospital administrator focused on operational efficiency.',
    image: 'https://picsum.photos/seed/jane/300',
    profile_pic: 'https://picsum.photos/seed/jane/300',
    is_verified: true,
    languages: 'English',
    total_reviews: 156,
    user: { email: 'jane@example.com' }
  }
];

export const SIDEBAR_LINKS = {
  [UserRole.USER]: [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/user/dashboard' },
    { label: 'Search Consultants', icon: <Search size={20} />, path: '/user/search' },
    { label: 'My Bookings', icon: <Calendar size={20} />, path: '/user/bookings' },
     { label: 'Credits', icon: <CreditCard size={20} />, path: '/user/credits' },
    { label: 'Messages', icon: <MessageSquare size={20} />, path: '/user/messages' },
    { label: 'Profile', icon: <Settings size={20} />, path: '/user/profile' },
    { label: "Support", icon: <HelpCircle size={20} />, path: "/user/support" },


  ],
  [UserRole.CONSULTANT]: [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/consultant/dashboard' },
    { label: 'My Bookings', icon: <Calendar size={20} />, path: '/consultant/bookings' },
    { label: 'Messages', icon: <MessageSquare size={20} />, path: '/consultant/messages' },
    { label: 'Availability', icon: <Calendar size={20} />, path: '/consultant/slots' },
    { label: 'Earnings', icon: <TrendingUp size={20} />, path: '/consultant/earnings' },
    { label: 'Profile', icon: <Briefcase size={20} />, path: '/consultant/profile' },
    { label: 'Reviews', icon: <TrendingUp size={20} />, path: '/consultant/reviews' },
    { label: 'Support', icon: <HelpCircle size={20} />, path: '/consultant/support' },
  ],
  [UserRole.ENTERPRISE_ADMIN]: [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/enterprise/dashboard' },
{ label: 'Company Profile', icon: <Building2 size={20} />, path: '/enterprise/profile' },
{ label: 'Team Management', icon: <Users size={20} />, path: '/enterprise/team' },
{ label: 'Bookings', icon: <CalendarDays size={20} />, path: '/enterprise/bookings' },
{ label: 'Earnings', icon: <Wallet size={20} />, path: '/enterprise/earnings' },
{ label: 'Analytics', icon: <TrendingUp size={20} />, path: '/enterprise/analytics' },
{ label: 'Enterprise Settings', icon: <Settings size={20} />, path: '/enterprise/settings' },
{ label: 'Messages', icon: <MessageSquare size={20} />, path: '/enterprise/messages' },
{ label: 'Support', icon: <LifeBuoy size={20} />, path: '/enterprise/support' },
{ label: 'Logout', icon: <LogOut size={20} />, path: '/logout' },
  ],

  [UserRole.ENTERPRISE_MEMBER]: [
    { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/member/dashboard" },
    { label: "My Profile", icon: <User size={18} />, path: "/member/profile" },
    { label: "My Availability", icon: <CalendarDays size={18} />, path: "/member/availability" },
    { label: "My Bookings", icon: <Video size={18} />, path: "/member/bookings" },
    { label: "My Earnings", icon: <DollarSign size={18} />, path: "/member/earnings" },
    { label: "Reviews", icon: <Star size={18} />, path: "/member/reviews" },
    { label: "Messages", icon: <MessageSquare size={18} />, path: "/member/messages" },
  ],

  [UserRole.PLATFORM_ADMIN]: [
    { label: 'Global Stats', icon: <TrendingUp size={20} />, path: '/admin/dashboard' },
    { label: 'Verifications', icon: <ShieldCheck size={20} />, path: '/admin/verify' },
    { label: 'Users', icon: <Users size={20} />, path: '/admin/users' },
  ]
};
