import {createNativeStackNavigator} from '@react-navigation/native-stack';
import TaskDetail from '../components/Calender/TaskDetails';
import {SCREENS} from '../Constants/Screens';
import AllTablesDetailsScreen from '../Screens/AllTablesDetailsScreen';
import FaceScaning from '../Screens/auth/FaceScaning';
import Absence from '../Screens/MainStack/Absence';
import AbsenceDetails from '../Screens/MainStack/AbsenceDetails';
import AbsenceHistory from '../Screens/MainStack/AbsenceHistory';
import AutomatedDocuments from '../Screens/MainStack/AutomatedDocuments';
import AccountSecurityScreen from '../Screens/MainStack/AccountSecurity/AccountSecurityScreen';
import GeneralSettingsScreen from '../Screens/MainStack/AccountSecurity/GeneralSettingsScreen';
import LoginActivityScreen from '../Screens/MainStack/AccountSecurity/LoginActivityScreen';
import LoginSecurityScreen from '../Screens/MainStack/AccountSecurity/LoginSecurityScreen';
import NotificationPreferencesScreen from '../Screens/MainStack/AccountSecurity/NotificationPreferencesScreen';
import AddDepartment from '../Screens/MainStack/AddDepartment';
import AddManualPunch from '../Screens/MainStack/AddManualPunch/AddManualPunch';
import AddTeam from '../Screens/MainStack/AddTeam';
import AddWorker from '../Screens/MainStack/AddWorker';
import AttendanceFaceScanning from '../Screens/MainStack/AttendanceFaceScanning';
import AttendenceRequestDetails from '../Screens/MainStack/AttendenceRequestDetails';
import Branding from '../Screens/MainStack/Branding';
import ChangePassword from '../Screens/MainStack/ChangePassword';
import ChatProfileScreen from '../Screens/MainStack/ChatProfileScreen';
import Conversation from '../Screens/MainStack/Conversation';
import CreateTask from '../Screens/MainStack/CreateTask/CreateTask';
import DepartmentDetails from '../Screens/MainStack/DepartmentDetails';
import DocumentDetails from '../Screens/MainStack/DocumentDetails';
import DocumentRequestDetails from '../Screens/MainStack/DocumentRequestDetails';
import EditProfile from '../Screens/MainStack/EditProfile';
import ExpenseRequestDetails from '../Screens/MainStack/ExpenseRequestDetails';
import FaceIdOption from '../Screens/MainStack/FaceIdOption';
import FaceVerification from '../Screens/MainStack/FaceVerification';
import GlobalSearch from '../Screens/MainStack/GlobalSearch';
import InformationRequestDetails from '../Screens/MainStack/InformationRequestDetails';
import LoanDetails from '../Screens/MainStack/LoanDetails';
import ManualAttendanceDetails from '../Screens/MainStack/ManualAttendanceDetails';
import MapScreen from '../Screens/MainStack/MapScreen';
import MapScreenGoogle from '../Screens/MainStack/MapScreenGoogle';
import MapScreenAttendance from '../Screens/MainStack/MapScreenAttendance';
import MyDocuments from '../Screens/MainStack/MyDocuments';
import MyLoans from '../Screens/MainStack/MyLoans';
import Notifications from '../Screens/MainStack/Notifications';
import Payments from '../Screens/MainStack/Payments';
import PaymentsDetails from '../Screens/MainStack/PaymentsDetails';
import PrivacyPolicy from '../Screens/MainStack/PrivacyPolicy';
import Profile from '../Screens/MainStack/Profile';
import ProfileDetails from '../Screens/MainStack/ProfileDetails';
import ProjectDetails from '../Screens/MainStack/ProjectDetails';
import RemunerationRequestDetails from '../Screens/MainStack/RemunerationRequestDetails';
import Reports from '../Screens/MainStack/Reports';
import ReportsScreen from '../Screens/MainStack/ReportsScreen';
import ReportsStatistics from '../Screens/MainStack/ReportsStatistics';
import RequestDetails from '../Screens/MainStack/RequestDetails';
import RequestManagement from '../Screens/MainStack/RequestManagement';
import RequestRequestDetails from '../Screens/MainStack/RequestRequestDetails';
import SelectInstallments from '../Screens/MainStack/SelectInstallments';
import SubmitDocumentRequest from '../Screens/MainStack/SubmitDocumentRequest';
import SubmitExpenseRequest from '../Screens/MainStack/SubmitExpenseRequest';
import SubmitInformationRequest from '../Screens/MainStack/SubmitInformationRequest';
import SubmitLeaveRequest from '../Screens/MainStack/SubmitLeaveRequest';
import Subscription from '../Screens/MainStack/Subscription';
// import TaskDetails from '../Screens/MainStack/TaskDetails';
// import TaskManagement from '../Screens/MainStack/TaskManagement';
import TeamDetails from '../Screens/MainStack/TeamDetails';
import TermsAndConditions from '../Screens/MainStack/Terms';
import UploadDocument from '../Screens/MainStack/UploadDocument';
import WorkerAttendenceDetails from '../Screens/MainStack/WorkerAttendenceDetails';
import WorkerDetails from '../Screens/MainStack/WorkerDetails';
import WorkerEmploymentDetails from '../Screens/MainStack/WorkerEmploymentDetails';
import WorkSchedule from '../Screens/MainStack/WorkSchedule';
import ViewAttendanceDetails from '../Screens/ViewAttendanceDetails';
import BottomTabNavigator from './BottomTabBar';
import Messages from '../Screens/BottomTabs/Messages';

const Stack = createNativeStackNavigator();
const MainStack = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={SCREENS.DASHBOARD} component={BottomTabNavigator} />
      <Stack.Screen name={SCREENS.SUBSCRIPTION} component={Subscription} />
      <Stack.Screen name={SCREENS.ADDWORKER} component={AddWorker} />
      <Stack.Screen
        name={SCREENS.WORKEREMPLOYMENTDETAILS}
        component={WorkerEmploymentDetails}
      />
      <Stack.Screen name={SCREENS.WORKERDETAILS} component={WorkerDetails} />
      <Stack.Screen name={SCREENS.ADDDEPARTMENT} component={AddDepartment} />
      <Stack.Screen
        name={SCREENS.DEPARTMENTDETAILS}
        component={DepartmentDetails}
      />
      <Stack.Screen name={SCREENS.ADDTEAM} component={AddTeam} />
      <Stack.Screen name={SCREENS.TEAMDETAILS} component={TeamDetails} />
      <Stack.Screen
        name={SCREENS.WORKERATTENDENCEDETAILS}
        component={WorkerAttendenceDetails}
      />
      <Stack.Screen name={SCREENS.ADDMANUALPUNCH} component={AddManualPunch} />
      <Stack.Screen
        name={SCREENS.MANUALATTENDANCEDETAILS}
        component={ManualAttendanceDetails}
      />
      {/* <Stack.Screen name={SCREENS.TASKMANAGEMENT} component={TaskManagement} /> */}
      <Stack.Screen name={SCREENS.CREATETASK} component={CreateTask} />
      <Stack.Screen name={SCREENS.PROJECTDETAILS} component={ProjectDetails} />
      <Stack.Screen name={SCREENS.UPLOADDOCUMENT} component={UploadDocument} />
      <Stack.Screen
        name={SCREENS.REQUESTMANAGEMENT}
        component={RequestManagement}
      />
      <Stack.Screen name={SCREENS.REQUESTDETAILS} component={RequestDetails} />
      <Stack.Screen name={SCREENS.ABSENCEHISTORY} component={AbsenceHistory} />
      <Stack.Screen
        name={SCREENS.INFORMATIONREQUESTDETAILS}
        component={InformationRequestDetails}
      />
      <Stack.Screen
        name={SCREENS.EXPENSEREQUESTDETAILS}
        component={ExpenseRequestDetails}
      />
      <Stack.Screen
        name={SCREENS.DOCUMENTREQUESTDETAILS}
        component={DocumentRequestDetails}
      />
      <Stack.Screen
        name={SCREENS.ATTENDENCEREQUESTDETAILS}
        component={AttendenceRequestDetails}
      />
      <Stack.Screen
        name={SCREENS.SUBMITINFORMATIONREQUEST}
        component={SubmitInformationRequest}
      />
      <Stack.Screen
        name={SCREENS.SUBMITEXPENSEREQUEST}
        component={SubmitExpenseRequest}
      />
      <Stack.Screen
        name={SCREENS.SUBMITDOCUMENTREQUEST}
        component={SubmitDocumentRequest}
      />
      <Stack.Screen
        name={SCREENS.SUBMITLEAVEREQUEST}
        component={SubmitLeaveRequest}
      />
      <Stack.Screen name={SCREENS.CONVERSATION} component={Conversation} />
      {/* <Stack.Screen name={SCREENS.CHATSCREEN} component={ChatScreen} /> */}
      <Stack.Screen
        name={SCREENS.CHATPROFILESCREEN}
        component={ChatProfileScreen}
      />
      <Stack.Screen name={SCREENS.PAYMENTS} component={Payments} />
      <Stack.Screen name={SCREENS.PAYMENTDETAILS} component={PaymentsDetails} />
      <Stack.Screen
        name={SCREENS.SELECTINSTALLMENTS}
        component={SelectInstallments}
      />
      <Stack.Screen name={SCREENS.MYDOCUMENTS} component={MyDocuments} />
      <Stack.Screen
        name={SCREENS.AUTOMATEDDOCUMENTS}
        component={AutomatedDocuments}
      />
      <Stack.Screen
        name={SCREENS.DOCUMENTDETAILS}
        component={DocumentDetails}
      />
      <Stack.Screen name={SCREENS.MYLOANS} component={MyLoans} />
      <Stack.Screen name={SCREENS.LOANDETAILS} component={LoanDetails} />
      <Stack.Screen name={SCREENS.PROFILE} component={Profile} />
      <Stack.Screen name={SCREENS.PROFILEDETAILS} component={ProfileDetails} />
      <Stack.Screen name={SCREENS.EDITPROFILE} component={EditProfile} />
      <Stack.Screen name={SCREENS.CHANGEPASSWORD} component={ChangePassword} />
      <Stack.Screen
        name={SCREENS.TERMSANDCONDITIONS}
        component={TermsAndConditions}
      />
      <Stack.Screen name={SCREENS.PRIVACYPOLICY} component={PrivacyPolicy} />
      <Stack.Screen
        name={SCREENS.ACCOUNTSECURITY}
        component={AccountSecurityScreen}
      />
      <Stack.Screen
        name={SCREENS.GENERALSETTINGS}
        component={GeneralSettingsScreen}
      />
      <Stack.Screen
        name={SCREENS.LOGINACTIVITY}
        component={LoginActivityScreen}
      />
      <Stack.Screen
        name={SCREENS.LOGINSECURITY}
        component={LoginSecurityScreen}
      />
      <Stack.Screen
        name={SCREENS.NOTIFICATIONPREFERENCES}
        component={NotificationPreferencesScreen}
      />
      <Stack.Screen name={SCREENS.GLOBALSEARCH} component={GlobalSearch} />
      <Stack.Screen name={SCREENS.NOTIFICATIONS} component={Notifications} />
      <Stack.Screen name={SCREENS.MESSAGES} component={Messages} />
      <Stack.Screen
        name={SCREENS.REPORTSSTATISTICS}
        component={ReportsStatistics}
      />
      <Stack.Screen
        name={SCREENS.FACEIDVERIFICATION}
        component={FaceVerification}
      />
      <Stack.Screen name={SCREENS.FACESCANING} component={FaceScaning} />
      {/* <Stack.Screen name={SCREENS.TASKDETAILS} component={TaskDetails} /> */}
      <Stack.Screen
        name={SCREENS.MAPSCREENATTENDANCE}
        component={MapScreenAttendance}
      />
      <Stack.Screen
        name={SCREENS.ATTENDANCEFACESCANNING}
        component={AttendanceFaceScanning}
      />
      <Stack.Screen
        name={SCREENS.VIEWATTENDANCEDETAILS}
        component={ViewAttendanceDetails}
      />
      <Stack.Screen
        name={SCREENS.REQUESTREQUESTDETAILS}
        component={RequestRequestDetails}
      />
      <Stack.Screen name={SCREENS.TASKDETAIL} component={TaskDetail} />
      <Stack.Screen
        name={SCREENS.REMUNERATIONREQUESTDETAILS}
        component={RemunerationRequestDetails}
      />
      <Stack.Screen name={SCREENS.FACEIDOPTION} component={FaceIdOption} />
      <Stack.Screen
        name={SCREENS.MAPSCREENGOOGLE}
        component={MapScreenGoogle}
      />
      <Stack.Screen name={SCREENS.MAPSCREEN} component={MapScreen} />
      <Stack.Screen name={SCREENS.BRANDING} component={Branding} />
      <Stack.Screen name={SCREENS.REPORTS} component={Reports} />
      <Stack.Screen name={SCREENS.REPORTSCREEN} component={ReportsScreen} />
      <Stack.Screen name={SCREENS.ABSENCE} component={Absence} />
      <Stack.Screen name={SCREENS.ABSENCEDETAILS} component={AbsenceDetails} />
      <Stack.Screen name={SCREENS.WORKSCHEDULE} component={WorkSchedule} />
      <Stack.Screen
        name={SCREENS.ALLTABLESDETAILS}
        component={AllTablesDetailsScreen}
      />
    </Stack.Navigator>
  );
};

export default MainStack;
