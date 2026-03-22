
import React from 'react';
import {
  LayoutDashboard,
  Factory,
  Building2,
  Globe,
  Clock,
  BarChart3,
  Scissors,
  Lightbulb,
  Wrench,
  Layers,
  CheckCircle2,
  Package,
  FileCheck,
  MonitorPlay,
  FileText,
  Share2
} from 'lucide-react';
import { ProjectStatus } from './types';

export const CATEGORIES: { id: ProjectStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'Summary', label: 'Summary', icon: <BarChart3 size={18} />, color: 'bg-blue-600' },
  { id: 'MDS SE', label: 'MDS SE', icon: <Factory size={18} />, color: 'bg-indigo-600' },
  { id: 'Unichela Panadura VE', label: 'Unichela Panadura VE', icon: <Building2 size={18} />, color: 'bg-orange-500' },
  { id: 'Casualine VE', label: 'Casualine VE', icon: <Globe size={18} />, color: 'bg-green-600' },
  { id: 'Long Term', label: 'Long Term', icon: <Clock size={18} />, color: 'bg-purple-600' },
];

export const PRODUCT_TYPES = ['Bra', 'Brief', 'Pant', 'Boxer', 'Bralette', 'Apparel'];

export const STATUS_COLORS: Record<string, string> = {
  'Completed': 'bg-green-100 text-green-800 border-green-200',
  'Ongoing': 'bg-orange-100 text-orange-800 border-orange-200',
  'HOLD': 'bg-red-100 text-red-800 border-red-200',
  'New': 'bg-blue-100 text-blue-800 border-blue-200',
};

export const PLANTS = [
  'Slimline',
  'Unichela Panadura',
  'Linea Clothing',
  'Slimtex',
  'Casualine',
  'Thurulie',
  'Kilinochchi',
  'Koggala',
  'Arya',
  'Vidiyal',
  'Bodyline'
];

export const PLANT_COLORS: Record<string, string> = {
  'Slimline': 'text-blue-400',
  'Unichela Panadura': 'text-orange-400',
  'Linea Clothing': 'text-green-400',
  'Slimtex': 'text-cyan-400',
  'Casualine': 'text-emerald-400',
  'Thurulie': 'text-lime-400',
  'Kilinochchi': 'text-red-400',
  'Koggala': 'text-yellow-400',
  'Arya': 'text-pink-400',
  'Vidiyal': 'text-purple-400',
  'Bodyline': 'text-indigo-400'
};

// Critical Path Stages shared across components
export const TIMELINE_STAGES = [
  { id: 'cut_check', label: 'Cut Kit', dateKey: 'cutKitChecking', icon: Scissors },
  { id: 'brainstorm', label: 'Brainstorm', dateKey: 'brainstormingDate', icon: Lightbulb },
  { id: 'mach_avail', label: 'Machine', dateKey: 'machineAvailabilityDate', icon: Wrench },
  { id: 'trial', label: 'Trial', dateKey: 'seTrialDate', icon: Layers },
  { id: 'mockup', label: 'Mockup', dateKey: 'mockupDate', icon: Package },
  { id: 'valid', label: 'Validation', dateKey: 'technicalValidationDate', icon: FileCheck },
  { id: 'video', label: 'Video', dateKey: 'videoDate', icon: MonitorPlay },
  { id: 'stw', label: 'STW', dateKey: 'stwDate', icon: FileText },
  { id: 'mds', label: 'MDS', dateKey: 'mdsDate', icon: FileText },
  { id: 'pd', label: 'Program Drawing', dateKey: 'pdDate', icon: FileText },
  { id: 'share', label: 'Share Plant', dateKey: 'sharePointDate', icon: Share2 },
];

export const STAGE_DESCRIPTIONS: Record<string, { title: string; description: string; color: string }> = {};
