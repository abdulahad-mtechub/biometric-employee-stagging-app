import {Images} from '../assets/Images/Images';
import {Svgs} from '../assets/Svgs/Svgs';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {Colors} from './themeColors';

export const workers = [
  {name: 'Johne Doe', status: 'Leave'},
  {name: 'Brooklyn Simmons', status: 'Present'},
  {name: 'Guy Hawkins', status: 'Absent'},
  {name: 'Robert Fox', status: 'Early Out'},
  {name: 'Robert Fox', status: 'Late Arrival'},
  {name: 'Jacob Jones', status: 'Half Leave'},
];
export const initialNotifications = [
  {
    key: '1',
    type: 'check-in',
    title: 'Worker Check-in!',
    name: 'Leslie Alexander',
    time: '06:55 AM',
    location: 'Barefoot Blvd • Storefront lane 3',
    date: '29 Feb 2024',
    isRead: false,
    avatar: '👨‍💼',
  },
  {
    key: '2',
    type: 'task-assigned',
    title: 'Task Assigned Successfully!',
    name: 'Facility Maintenance Checklist',
    time: '05:34 AM',
    location: 'Zone B Unit 3 • Storefront lane 3',
    date: 'Yesterday at 10:24 AM',
    isRead: true,
    avatar: '✅',
  },
  {
    key: '3',
    type: 'check-out',
    title: 'Worker Check-Out!',
    name: 'Darrell Steward',
    time: '05:12 PM',
    location: 'Workstream Zone 3',
    date: '29 Feb 2024 at 05:12 PM',
    isRead: false,
    avatar: '👨‍🔧',
  },
  {
    key: '4',
    type: 'check-in',
    title: 'Worker Check-in!',
    name: 'Carlos Hancock',
    time: '10:12 AM',
    location: 'Scheduled Item at Zone 3',
    date: '28 Feb 2024 at 10:12 AM',
    isRead: false,
    avatar: '👷‍♂️',
  },
  {
    key: '5',
    type: 'task-complete',
    title: 'Task Complete!',
    name: 'Emily Chen',
    time: '08:12 AM',
    location: 'Supermart at Zone 2',
    date: '1st Oct, 2024 at 8:12 AM',
    isRead: true,
    avatar: '🏆',
  },
  {
    key: '6',
    type: 'deadline-missed',
    title: 'Deadline Missed!',
    name: 'Facility Maintenance',
    time: '11:30 AM',
    location: 'Zone A',
    date: '1st Oct, 2024 at 11:30 AM',
    isRead: false,
    avatar: '⚠️',
  },
];

export const Teams = [
  {name: 'Teams 3', Dep: 'Design Development', status: 'Active'},
  {name: 'Team 2', Dep: 'Design Development', status: 'Active'},
  {name: 'Team 4', Dep: 'Design Development', status: 'Active'},
  {name: 'Team 3', Dep: 'Design Development', status: 'Active'},
  {name: 'Team 1', Dep: 'Design Development', status: 'Inactive'},
  {name: 'Team 2', Dep: 'Design Development', status: 'Active'},
];
export const zonesData = [
  {id: '1', name: 'Northern Europe'},
  {id: '2', name: 'Southern Europe'},
];

export const countriesData = [
  {id: '1', name: 'Spain'},
  {id: '2', name: 'Italy'},
  {id: '3', name: 'Portugal'},
];

export const citiesData = [{id: '1', name: 'All'}];
export const workerScreenData = [
  {name: 'Brooklyn Simmons', status: 'Invited'},
  {name: 'Zenith Retail Group Pty. Ltd.', status: 'Request'},
  {name: 'Esther Howard', status: 'Invited'},
  {name: 'Jane Cooper', status: 'Active'},
  {name: 'Jacob Jones', status: 'Inactive'},
  {name: 'Robert Fox', status: 'Active'},
  {name: 'John Doe', status: 'Request'},
];
export const DashboardRequestsData = [
  {Request: 'Address updated', status: 'Requested'},
  {Request: 'Sick Leave', status: 'Processing'},
  {Request: 'Traveling Expense', status: 'Approved'},
  {Request: 'House Loan', status: 'Approved'},
  {Request: 'Experience Letter', status: 'Approved'},
];
export const AbsenceHistoryCardsData = [
  {
    title: 'Sick Leave',
    value: '12',
    subText: '15 Sick leave quota available',
    progress: 70,
  },
  {
    title: 'Urgent Leave',
    value: '120',
    subText: '7  Urgent leave quota available',
    progress: 20,
  },
  {
    title: 'Half Leave',
    value: '120',
    subText: '6 Half leave quota available',
    progress: 40,
  },
  {
    title: 'Annual Leave',
    value: '120',
    subText: '15 Annual leaves quota available',
    progress: 60,
  },
];
export const AttendanceRequestsData = [
  {
    name: 'Missed Punch',
    date: '12 May',
    time: '04:00 PM',
    status: 'Approved',
  },
  {name: 'Sick Leave', date: '12 May', time: '04:00 PM', status: 'Approved'},
  {
    name: 'Urgent Leave',
    date: '12 May',
    time: '04:00 PM',
    status: 'Processing',
  },
  {
    name: 'Annual Leave',
    date: '12 May',
    time: '04:00 PM',
    status: 'Processing',
  },
  {name: 'Missed Punch', date: '12 May', time: '04:00 PM', status: 'Rejected'},
  {name: 'Casual Leave', date: '12 May', time: '04:00 PM', status: 'Rejected'},
  {
    name: 'Local Punch Deleted',
    date: '12 May',
    time: '04:00 PM',
    status: 'Processing',
  },
  {
    name: 'Sick Leave',
    date: '12 May',
    time: '04:00 PM',
    status: 'Requested',
  },
];
export const AbsenceHistoryData = [
  {
    name: 'Missed Punch',
    dateFrom: '12 May',

    status: 'Requested',
  },
  {name: 'Sick Leave', dateFrom: '12 May', status: 'Processing'},
  {
    name: 'Urgent Leave',
    dateFrom: '12 May',
    dateTo: '14 May',
    status: 'Requested',
  },
  {
    name: 'Annual Leave',
    dateFrom: '18 May',
    dateTo: '20 May',
    status: 'Processing',
  },
  {name: 'Missed Punch', dateFrom: '14 April', status: 'Rejected'},
  {name: 'Casual Leave', dateFrom: '08 May', status: 'Rejected'},
  {
    name: 'Local Punch Deleted',
    dateFrom: '20 Feb',
    dateTo: '28 Feb',
    status: 'Processing',
  },
  {
    name: 'Sick Leave',
    dateFrom: '06 Jan',
    dateTo: '09 Jan',
    status: 'Requested',
  },
];
export const departments = [
  {id: '1', title: 'Design Department'},
  {id: '2', title: 'QA Department'},
  {id: '3', title: 'R&D Department'},
  {id: '4', title: 'Marketing Department'},
  {id: '5', title: 'BA Department'},
  {id: '6', title: 'Development Department'},
];
export const projects = [
  {id: '1', title: 'PR-02-123'},
  {id: '2', title: 'PR-02-123'},
  {id: '3', title: 'PR-02-123'},
  {id: '4', title: 'PR-02-123'},
  {id: '5', title: 'PR-02-123'},
  {id: '6', title: 'PR-02-123'},
];
export const DashboardData = [
  {
    title: 'Completed Task',
    value: '180',
    subText: '↗ 2 new assign this week',
  },
  {
    title: 'Absent',
    value: '180',
    subText: '12 Teams',
  },
  {
    title: 'Request',
    value: '15',
    subText: '2 attendance, 1 expense, 3 document',
  },
  {
    title: 'Sick Leave',
    value: '12',
    subText: '15 Sick leave quota available',
    progress: 70,
  },
  {
    title: 'Urgent Leave',
    value: '120',
    subText: '7  Urgent leave quota available',
    progress: 20,
  },
  {
    title: 'Half Leave',
    value: '120',
    subText: '6 Half leave quota available',
    progress: 40,
  },
  {
    title: 'Annual Leave',
    value: '120',
    subText: '15 Annual leaves quota available',
    progress: 60,
  },
];
export const remindersData = [
  {
    id: '1',
    title: 'Sick Leave',
    subTitle: 'Approved',
    date: '13 May, 2025',
    icon: <Svgs.greenCalender />,
  },
  {
    id: '2',
    title: 'Task 1 | PR–231–21',
    subTitle: 'Assigned',
    date: '12 May, 2025',
    icon: <Svgs.workerBlueCheck />,
  },
  {
    id: '3',
    title: 'Task 3 | PR–421–21',
    subTitle: 'Deadline',
    date: '12 May, 2025',
    icon: <Svgs.redCalender />,
  },
  {
    id: '4',
    title: 'Monthly Salary',
    subTitle: 'Payment',
    date: '12 May, 2025',
    icon: <Svgs.purpleCalender />,
  },
];

export const workerData = [
  {name: 'Brooklyn Simmons', status: 'Invited'},
  {name: 'Zenith Retail Group Pty. Ltd.', status: 'Request'},
  {name: 'Esther Howard', status: 'Invited'},
  {name: 'Jane Cooper', status: 'Active'},
  {name: 'Jacob Jones', status: 'Inactive'},
  {name: 'Robert Fox', status: 'Active'},
  {name: 'John Doe', status: 'Request'},
];
export const statusStyles = {
  Leave: {
    backgroundColor: '#60A5FA',
    color: '#ffffff',
    icon: <Svgs.mailL height={hp(2)} />,
    name: 'Leave',
  },
  'On Time': {
    backgroundColor: '#4BCE97',
    color: '#ffffff',
    icon: <Svgs.CheckOutline height={hp(2)} />,
    name: 'On Time',
  },
  Invited: {
    backgroundColor: '#60A5FA',
    color: '#ffffff',
    icon: <Svgs.mailL height={hp(2)} />,
  },
  Present: {
    backgroundColor: '#34D399',
    color: '#ffffff',
    icon: <Svgs.CheckOutline height={hp(2)} />,
  },
  Active: {
    backgroundColor: '#34D399',
    color: '#ffffff',
    icon: <Svgs.CheckOutline height={hp(2)} />,
  },
  Absent: {
    backgroundColor: '#F87171',
    color: '#ffffff',
    icon: <Svgs.CheckOutline height={hp(2)} />,
  },
  Inactive: {
    backgroundColor: '#F87171',
    color: '#ffffff',
    icon: <Svgs.CheckOutline height={hp(2)} />,
  },
  'Early Out': {
    backgroundColor: '#A78BFA',
    color: '#ffffff',
    icon: <Svgs.earlyOut height={hp(2)} />,
    name: 'Early Out',
  },
  'Late Arrival': {
    backgroundColor: '#FB923C',
    color: '#000000',
    icon: <Svgs.CheckOutlineBlack height={hp(2)} />,
  },
  'Half Leave': {
    backgroundColor: '#FACC15',
    color: '#000000',
    icon: <Svgs.halfLeave height={hp(2)} />,
  },
  Request: {
    backgroundColor: '#FACC15',
    color: '#000000',
    icon: <Svgs.halfLeave height={hp(2)} />,
  },
  Valid: {
    backgroundColor: Colors.lightTheme.primaryColor,
    color: '#ffffff',
    icon: <Svgs.lateWhite height={hp(2)} />,
  },
  Invalid: {
    backgroundColor: '#D50A0A',
    color: '#ffffff',
    icon: <Svgs.alertOutline height={hp(2)} />,
  },
  Rejected: {
    backgroundColor: '#D50A0A',
    color: '#ffffff',
    icon: <Svgs.CrossOutlineFill height={hp(2)} />,
  },
  Requested: {
    backgroundColor: '#F5CD47',
    color: '#000000',
    icon: <Svgs.halfLeave height={hp(2)} />,
  },
  Approved: {
    backgroundColor: '#34D399',
    color: '#ffffff',
    icon: <Svgs.CheckOutline height={hp(2)} />,
  },
  Processing: {
    backgroundColor: '#579DFF',
    color: '#ffffff',
    icon: <Svgs.Processing height={hp(2)} />,
  },
  Ongoing: {
    backgroundColor: '#9F8FEF',
    color: '#ffffff',
    icon: <Svgs.ongoingWhite height={hp(2)} width={hp(2)} />,
  },
};
export const Departments = [
  {name: 'Design Department', status: 'Active'},
  {name: 'Service Department', status: 'Active'},
  {name: 'Marketing Department', status: 'Active'},
  {name: 'HR Department', status: 'Active'},
  {name: 'Development Department', status: 'Inactive'},
  {name: 'Departamento de Desarrollot', status: 'Active'},
];

export const TaskManagementData = [
  {
    title: 'Assigned Projects',
    value: '180',
    subText: '3 new assign this month',
  },
  {
    title: 'Completed Projects',
    value: '180',
    subText: '+5 more from last month',
  },

  {
    title: 'Ongoing Projects',
    value: '12',
    subText: '2 started this week',
  },
  {
    title: 'Delayed',
    value: '120',
    subText: '-3 delation down from last month',
  },
  {
    title: 'Issue',
    value: '120',
    subText: '3 issues this week',
  },
  {
    title: 'Hold',
    value: '120',
    subText: '1 on hold this week',
  },
];

export const Symbols = {
  Present: {
    icon: <Svgs.tickWhite height={hp(2.5)} width={hp(2.5)} />, // Replace with actual SVG
    backgroundColor: '#4BCE97',
  },
  'Late Arrival': {
    icon: <Svgs.lateWhite height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#FBA64C',
  },
  Absent: {
    icon: <Svgs.crossWhite height={hp(4)} width={hp(4)} />,
    backgroundColor: '#F75555',
  },
  Error: {
    icon: <Svgs.alertWhite height={hp(5)} width={hp(5)} />,
    backgroundColor: '#F87168',
  },
  'Early Out': {
    icon: <Svgs.earlyOut height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#B891F3',
  },
  Leave: {
    icon: <Svgs.leaveWhite height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#65B7F3',
  },
  'Half Leave': {
    icon: <Svgs.halfLeav height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#FFD645',
  },

  Assigned: {
    icon: <Svgs.leaveWhite height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#65B7F3',
  },
  Completed: {
    icon: <Svgs.tickWhite height={hp(2.5)} width={hp(2.5)} />, // Replace with actual SVG
    backgroundColor: '#4BCE97',
  },
  Ongoing: {
    icon: <Svgs.ongoingWhite height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#B891F3',
  },
  Delayed: {
    icon: <Svgs.lateWhite height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#F75555',
  },
  Conflict: {
    icon: <Svgs.alertWhite height={hp(5)} width={hp(5)} />,
    backgroundColor: '#FBA64C',
  },
  Hold: {
    icon: <Svgs.hold height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#FFD645',
  },
  Approved: {
    icon: <Svgs.tickWhite height={hp(2.5)} width={hp(2.5)} />, // Replace with actual SVG
    backgroundColor: '#4BCE97',
  },
  Rejected: {
    icon: <Svgs.crossWhite height={hp(4)} width={hp(4)} />,
    backgroundColor: '#F75555',
  },
  Processing: {
    icon: <Svgs.Processing height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#65B7F3',
  },
  Requested: {
    icon: <Svgs.halfLeave height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#FFD645',
  },
  Paid: {
    icon: <Svgs.tickWhite height={hp(2.5)} width={hp(2.5)} />, // Replace with actual SVG
    backgroundColor: '#4BCE97',
  },
  Pending: {
    icon: <Svgs.pending height={hp(2.5)} width={hp(2.5)} />,
    backgroundColor: '#65B7F3',
  },
  Active: {
    icon: <Svgs.tickWhite height={hp(2.5)} width={hp(2.5)} />, // Replace with actual SVG
    backgroundColor: '#4BCE97',
  },
  Inactive: {
    icon: <Svgs.crossWhite height={hp(4)} width={hp(4)} />,
    backgroundColor: '#F75555',
  },
};

export const AttendanceSymbols = [
  'Present',
  'Early Out',
  'Late Arrival',
  'Leave',
  'Absent',
  'Half Leave',
  'Error',
];

export const TaskSymbols = [
  'Assigned',
  'Completed',
  'Ongoing',
  'Delayed',
  'Conflict',
  'Hold',
];

export const RequestSymbols = [
  'Approved',
  'Rejected',
  'Processing',
  'Requested',
];

export const PaymentsSymbols = ['Paid', 'Error', 'Pending'];

export const DocumentsSymbols = ['Active', 'Inactive'];
export const LoanSymbols = ['Paid', 'Error'];

export const dashboardDataV2 = [
  {
    title: 'Completed Task',
    value: 120,
    subText: '+3 more from last month',
  },
  {
    title: 'Ongoing',
    value: 13,
    subText: '2 started this week',
  },
  {
    title: 'Requests',
    value: 4,
    subText: '1 request this week',
  },
];

export const DepartmentData = [
  {
    title: 'Assigned Task',
    value: 13,
    subText: '2 started this week',
  },
  {
    title: 'Completed Task',
    value: 120,
    subText: '+3 more from last month',
  },

  {
    title: 'Ongoing',
    value: 4,
    subText: '1 request this week',
  },
];

export const attendanceData = [
  {date: '13 May', status: 'Present', time: '09:02 AM – 07:00 PM'},
  {date: '12 May', status: 'Present', time: '09:02 AM – 07:00 PM'},
  {date: '11 May', status: 'Early Out', time: '09:02 AM – 07:00 PM'},
  {date: '10 May', status: 'Early Out', time: '09:02 AM – 07:00 PM'},
  {date: '09 May', status: 'Late Arrival', time: '09:02 AM – 07:00 PM'},
  {date: '08 May', status: 'Late Arrival', time: '09:02 AM – 07:00 PM'},
  {date: '07 May', status: 'Leave', time: '09:02 AM – 07:00 PM'},
  {date: '06 May', status: 'Leave', time: '09:02 AM – 07:00 PM'},
  {date: '05 May', status: 'Absent', time: '09:02 AM – 07:00 PM'},
  {date: '04 May', status: 'Absent', time: '09:02 AM – 07:00 PM'},
  {date: '03 May', status: 'Half Leave', time: '09:02 AM – 07:00 PM'},
  {date: '02 May', status: 'Half Leave', time: '09:02 AM – 07:00 PM'},
  {date: '01 May', status: 'Error', time: '09:02 AM – 07:00 PM'},
];

export const loanData = [
  {
    title: 'Car Loan',
    date: '24, May 2025',
    amount: '12,300',
    installment: '1,025',
  },
  {
    title: 'Salary Loan',
    date: '24, May 2025',
    amount: '12,300',
    installment: '1,025',
  },
  {
    title: 'Emergency Loan',
    date: '24, May 2025',
    amount: '12,300',
    installment: '1,025',
  },
  {
    title: 'Education Loan',
    date: '24, May 2025',
    amount: '12,300',
    installment: '1,025',
  },
  {
    title: 'Travel or Relocation Loan',
    date: '24, May 2025',
    amount: '12,300',
    installment: '1,025',
  },
  {
    title: 'Housing Loan Assistance',
    date: '24, May 2025',
    amount: '12,300',
    installment: '1,025',
  },
  {
    title: 'Personal Loan',
    date: '24, May 2025',
    amount: '12,300',
    installment: '1,025',
  },
];

export const tasksData = [
  {id: 'TK-02-123', date: '12 May', time: '04:00 PM', status: 'Completed'},
  {id: 'TK-02-123', date: '12 May', time: '04:00 PM', status: 'Completed'},
  {id: 'TK-02-123', date: '12 May', time: '04:00 PM', status: 'Ongoing'},
  {id: 'TK-02-123', date: '12 May', time: '04:00 PM', status: 'Delayed'},
  {id: 'TK-02-123', date: '12 May', time: '04:00 PM', status: 'Ongoing'},
  {id: 'TK-02-123', date: '12 May', time: '04:00 PM', status: 'Ongoing'},
  {id: 'TK-02-123', date: '12 May', time: '04:00 PM', status: 'Hold'},
  {id: 'TK-02-123', date: '12 May', time: '04:00 PM', status: 'Assigned'},
];
export const projectsData = [
  {id: 'PR-02-123', date: '12 May', time: '04:00 PM', status: 'Completed'},
  {id: 'PR-02-123', date: '12 May', time: '04:00 PM', status: 'Completed'},
  {id: 'PR-02-123', date: '12 May', time: '04:00 PM', status: 'Ongoing'},
  {id: 'PR-02-123', date: '12 May', time: '04:00 PM', status: 'Delayed'},
  {id: 'PR-02-123', date: '12 May', time: '04:00 PM', status: 'Ongoing'},
  {id: 'PR-02-123', date: '12 May', time: '04:00 PM', status: 'Ongoing'},
  {id: 'PR-02-123', date: '12 May', time: '04:00 PM', status: 'Hold'},
  {id: 'PR-02-123', date: '12 May', time: '04:00 PM', status: 'Assigned'},
];
export const requestsData = [
  {
    name: 'Address Updated',
    date: '12 May',
    time: '04:00 PM',
    status: 'Approved',
  },
  {name: 'Sick Leave', date: '12 May', time: '04:00 PM', status: 'Approved'},
  {
    name: 'Name Changed',
    date: '12 May',
    time: '04:00 PM',
    status: 'Processing',
  },
  {
    name: 'Medical Expense',
    date: '12 May',
    time: '04:00 PM',
    status: 'Processing',
  },
  {name: 'Loan', date: '12 May', time: '04:00 PM', status: 'Rejected'},
  {name: 'Missed Punch', date: '12 May', time: '04:00 PM', status: 'Rejected'},
  {
    name: 'Experience Letter',
    date: '12 May',
    time: '04:00 PM',
    status: 'Processing',
  },
  {
    name: 'Increment Letter',
    date: '12 May',
    time: '04:00 PM',
    status: 'Requested',
  },
];
export const InformationRequestsData = [
  {
    name: 'Address Updated',
    date: '12 May',
    time: '04:00 PM',
    status: 'Approved',
  },
  {name: 'Sick Leave', date: '12 May', time: '04:00 PM', status: 'Approved'},
  {
    name: 'Name Changed',
    date: '12 May',
    time: '04:00 PM',
    status: 'Processing',
  },
  {
    name: 'NIC Mistake',
    date: '12 May',
    time: '04:00 PM',
    status: 'Processing',
  },
  {name: 'Name Mistake', date: '12 May', time: '04:00 PM', status: 'Rejected'},
  {name: 'NIC Mistake', date: '12 May', time: '04:00 PM', status: 'Rejected'},
  {
    name: 'Letter Data Mistake',
    date: '12 May',
    time: '04:00 PM',
    status: 'Processing',
  },
  {
    name: 'NIC Mistake',
    date: '12 May',
    time: '04:00 PM',
    status: 'Requested',
  },
];
export const expenseData = [
  {
    name: 'Traveling Expense',
    date: '12 May',
    time: '04:00 PM',
    status: 'Approved',
  },
  {name: 'House Loan', date: '12 May', time: '04:00 PM', status: 'Approved'},
  {
    name: 'Car Loan',
    date: '12 May',
    time: '04:00 PM',
    status: 'Processing',
  },
  {
    name: 'Chair Expense',
    date: '12 May',
    time: '04:00 PM',
    status: 'Processing',
  },
  {name: 'Personal Loan', date: '12 May', time: '04:00 PM', status: 'Rejected'},
  {
    name: 'Educational Loan',
    date: '12 May',
    time: '04:00 PM',
    status: 'Rejected',
  },
  {
    name: 'Emergency Loan',
    date: '12 May',
    time: '04:00 PM',
    status: 'Processing',
  },
  {
    name: 'Medical Expense',
    date: '12 May',
    time: '04:00 PM',
    status: 'Requested',
  },
];
export const documentRequestData = [
  {
    name: 'Experience Letter',
    date: '12 May',
    time: '04:00 PM',
    status: 'Approved',
  },
  {name: 'Contract', date: '12 May', time: '04:00 PM', status: 'Approved'},
  {
    name: 'Pay Slip',
    date: '12 May',
    time: '04:00 PM',
    status: 'Processing',
  },
  {
    name: 'Chair Expense',
    date: '12 May',
    time: '04:00 PM',
    status: 'Processing',
  },
  {
    name: 'Company Policy',
    date: '12 May',
    time: '04:00 PM',
    status: 'Rejected',
  },
  {
    name: 'Expense Policy',
    date: '12 May',
    time: '04:00 PM',
    status: 'Rejected',
  },
  {
    name: 'Promotion Letter',
    date: '12 May',
    time: '04:00 PM',
    status: 'Processing',
  },
  {
    name: 'Increment Letter',
    date: '12 May',
    time: '04:00 PM',
    status: 'Requested',
  },
];
export const paymentsData = [
  {name: 'Monthly Salary', date: '12 May', time: '04:00 PM', status: 'Paid'},

  {name: 'Weekend Salary', date: '12 May', time: '04:00 PM', status: 'Paid'},
  {name: 'House Loan', date: '12 May', time: '04:00 PM', status: 'Pending'},
  {
    name: 'Traveling Expense',
    date: '12 May',
    time: '04:00 PM',
    status: 'Pending',
  },
  {
    name: 'Extra Work Payment',
    date: '12 May',
    time: '04:00 PM',
    status: 'Error',
  },
  {name: 'Car Loan', date: '12 May', time: '04:00 PM', status: 'Error'},
];
export const LoanInstallmentsData = [
  {name: '$12,300', date: '12 May', time: '04:00 PM', status: 'Paid'},

  {name: '$12,300', date: '12 May', time: '04:00 PM', status: 'Paid'},
  {name: '$12,300', date: '12 May', time: '04:00 PM', status: 'Pending'},
  {
    name: '$12,300',
    date: '12 May',
    time: '04:00 PM',
    status: 'Pending',
  },
  {
    name: '$12,300',
    date: '12 May',
    time: '04:00 PM',
    status: 'Error',
  },
  {name: '$12,300', date: '12 May', time: '04:00 PM', status: 'Error'},
];
export const documentsData = [
  {name: 'DO–12 SRS Doc', date: '12 May', time: '04:00 PM', status: 'Active'},
  {name: 'DO–12 SRS Doc', date: '12 May', time: '04:00 PM', status: 'Active'},
  {name: 'DO–12 SRS Doc', date: '12 May', time: '04:00 PM', status: 'Active'},
  {name: 'DO–12 SRS Doc', date: '12 May', time: '04:00 PM', status: 'Active'},
  {name: 'DO–12 SRS Doc', date: '12 May', time: '04:00 PM', status: 'Inactive'},
  {name: 'DO–12 SRS Doc', date: '12 May', time: '04:00 PM', status: 'Inactive'},
];
export const companyPoliciesData = [
  {name: 'Company Policy Agreement', date: '12 May'},
  {name: 'Expense Policy', date: '12 May'},
];

export const departmentMembers = [
  {title: 'Brooklyn Simmons', image: Images.artist1},
  {title: 'Jane Cooper', image: Images.artist1},
  {title: 'Jacob Jones', image: Images.artist1},
  {title: 'Robert Fox', image: Images.artist1},
  {title: 'John Doe', image: Images.artist1},
  {title: 'Guy Hawkins', image: Images.artist1},
  {title: 'Esther Howard', image: Images.artist1},
  {title: 'Jane Cooper', image: Images.artist1},
];

export const AttendancePunchData = [
  {
    id: 1,
    date: '07 May, 2025',
    name: 'Brooklyn Simmons',
    timeRange: '09:02 AM – 07:00 PM',
    image: Images.artist1,
    status: 'Present',
  },
  {
    id: 2,
    date: '06 May, 2025',
    name: 'Brooklyn Simmons',
    timeRange: '09:01 AM – 07:02 PM',
    image: Images.artist1,
    status: 'Absent',
  },
  {
    id: 3,
    date: '05 May, 2025',
    name: 'Brooklyn Simmons',
    timeRange: '09:00 AM – 07:00 PM',
    image: Images.artist1,
    status: 'Early Out',
  },
  {
    id: 4,
    date: '04 May, 2025',
    name: 'Brooklyn Simmons',
    timeRange: '09:03 AM – 06:58 PM',
    image: Images.artist1,
    status: 'Late Arrival',
  },
  {
    id: 5,
    date: '03 May, 2025',
    name: 'Brooklyn Simmons',
    timeRange: '09:05 AM – 07:00 PM',
    image: Images.artist1,
    status: 'Leave',
  },
  {
    id: 6,
    date: '02 May, 2025',
    name: 'Brooklyn Simmons',
    timeRange: '09:02 AM – 06:55 PM',
    image: Images.artist1,
    status: 'Half Leave',
  },
  {
    id: 7,
    date: '01 May, 2025',
    name: 'Brooklyn Simmons',
    timeRange: '09:04 AM – 07:01 PM',
    image: Images.artist1,
    status: 'Leave',
  },
  {
    id: 8,
    date: '30 April, 2025',
    name: 'Brooklyn Simmons',
    timeRange: '09:06 AM – 07:00 PM',
    image: Images.artist1,
    status: 'Present',
  },
  {
    id: 9,
    date: '29 April, 2025',
    name: 'Brooklyn Simmons',
    timeRange: '09:00 AM – 06:59 PM',
    image: Images.artist1,
    status: 'Absent',
  },
  {
    id: 10,
    date: '28 April, 2025',
    name: 'Brooklyn Simmons',
    timeRange: '09:02 AM – 07:00 PM',
    image: Images.artist1,
    status: 'Present',
  },
];
export const manualPunches = [
  {
    id: '1',
    name: 'Brooklyn Simmons',
    avatar: Images.artist1,
    reason: 'Missed Punch',
    date: '12 May',
    time: '04:00 PM',
  },
  {
    id: '2',
    name: 'Brooklyn Simmons',
    avatar: Images.artist1,
    reason: 'System Mainta​ince',
    date: '12 May',
    time: '04:00 PM',
  },
  {
    id: '3',
    name: 'Brooklyn Simmons',
    avatar: Images.artist1,
    reason: 'System Mainta​ince',
    date: '12 May',
    time: '04:00 PM',
  },
  {
    id: '4',
    name: 'Brooklyn Simmons',
    avatar: Images.artist1,
    reason: 'System Mainta​ince',
    date: '12 May',
    time: '04:00 PM',
  },
  {
    id: '5',
    name: 'Brooklyn Simmons',
    avatar: Images.artist1,
    reason: 'System Mainta​ince',
    date: '12 May',
    time: '04:00 PM',
  },
  // ... more items
];

export const citiesChatData = [
  {country: 'Spain', value: 940, flag: '🇪🇸'},
  {country: 'USA', value: 900, flag: '🇺🇸'},
  {country: 'UK', value: 830, flag: '🇬🇧'},
  {country: 'Russia', value: 810, flag: '🇷🇺'},
  {country: 'China', value: 740, flag: '🇨🇳'},
  {country: 'Australia', value: 620, flag: '🇦🇺'},
  {country: 'Turkey', value: 480, flag: '🇹🇷'},
  {country: 'Others', value: 450, flag: '🌐'}, // Generic globe icon for 'Others'
];
