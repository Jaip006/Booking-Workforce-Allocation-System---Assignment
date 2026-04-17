export interface Team {
  _id: string;
  name: string;
  workerCount: number;
  schedule: ScheduleEntry[];
}

export interface ScheduleEntry {
  startDate: string;
  endDate: string;
  bookingId: string;
  activityId: string;
}

export interface ActivityTemplate {
  stepNumber: number;
  activityName: string;
  gapDays: number;
  efficiency: number;
  bookingAmountPerAcre: number;
}

export interface CropTemplate {
  _id: string;
  name: string;
  activities: ActivityTemplate[];
}

export interface Booking {
  _id: string;
  farmerName: string;
  farmerContact: string;
  farmerLocation: string;
  landSize: number;
  cropType: CropTemplate;
  startDate: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  createdAt: string;
  projectedProfit?: number;
}

export interface Financials {
  duration: number;
  cost: number;
  revenue: number;
  profit: number;
  efficiency?: number;
}

export interface ScheduledActivity {
  _id: string;
  bookingId: string;
  stepNumber: number;
  activityName: string;
  teamId: Team | null;
  plannedStartDate: string;
  plannedEndDate: string;
  status: 'Proposed' | 'Confirmed' | 'Completed' | 'Rejected' | 'ResourceConflict';
  financials: Financials;
  nextAvailableSlot: string | null;
  rescheduleCount?: number;
  completedByTeam?: string | null;
}

export interface DashboardData {
  summary: {
    totalBookings: number;
    activeBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    resourceConflicts: number;
    confirmedActivities: number;
    proposedActivities: number;
  };
  bottleneckAlert: boolean;
  bottleneckTeams: { teamId: string; name: string; scheduleCount: number; isBottleneck: boolean }[];
  recentBookings: (Booking & { projectedProfit: number })[];
  teamUtilization: { teamId: string; name: string; workerCount: number; scheduledJobs: number }[];
}
