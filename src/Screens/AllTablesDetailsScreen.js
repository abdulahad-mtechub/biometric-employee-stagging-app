import React from 'react';
import {View, Text, ScrollView, StyleSheet, FlatList} from 'react-native';
import {useSelector} from 'react-redux';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {useRoute} from '@react-navigation/native';

const SectionCard = ({title, children}) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const renderKeyValue = item => {
  if (!item || typeof item !== 'object') return null;
  return Object.entries(item).map(([key, value]) => (
    <View key={key} style={styles.kvRow}>
      <Text style={styles.kvKey}>{key}:</Text>
      <Text style={styles.kvValue}>
        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
      </Text>
    </View>
  ));
};

const renderList = (data, emptyText) =>
  data && data.length > 0 ? (
    <FlatList
      data={data}
      keyExtractor={(item, idx) => (item.id ? String(item.id) : String(idx))}
      renderItem={({item}) => (
        <View style={styles.itemCard}>{renderKeyValue(item)}</View>
      )}
    />
  ) : (
    <Text style={styles.emptyText}>{emptyText}</Text>
  );

const AllTablesDetailsScreen = () => {
  const route = useRoute();
  // Prefer navigation params if available, else fallback to Redux
  const tasks =
    route.params?.recentTasks ?? useSelector(state => state?.tasks?.list || []);
  const remunerationApiData =
    route.params?.recentRemuneration ??
    useSelector(state => state?.remuneration?.list || []);
  const attendanceApiData =
    route.params?.monthlyAttendance ??
    useSelector(state => state?.attendance?.list || []);
  const DashboardData =
    route.params?.dashboard ??
    useSelector(state => state?.dashboard?.list || []);
  const hrRequestsApiData =
    route.params?.requests ?? useSelector(state => state?.requests?.list || []);
  const taskStatsData =
    route.params?.taskStats ?? useSelector(state => state?.tasks?.stats || []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{paddingBottom: 40}}>
      <Text style={styles.header}>All Tables Details</Text>
      <SectionCard title="Recent Tasks">
        {renderList(tasks, 'No recent tasks.')}
      </SectionCard>
      <SectionCard title="Recent Remuneration">
        {renderList(remunerationApiData, 'No remuneration data.')}
      </SectionCard>
      <SectionCard title="Monthly Attendance">
        {renderList(attendanceApiData, 'No attendance data.')}
      </SectionCard>
      <SectionCard title="Dashboard">
        {renderList(DashboardData, 'No dashboard data.')}
      </SectionCard>
      <SectionCard title="Requests">
        {renderList(hrRequestsApiData, 'No requests.')}
      </SectionCard>
      <SectionCard title="Task Stats">
        {renderList(taskStatsData, 'No task stats.')}
      </SectionCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    padding: 10,
  },
  header: {
    fontSize: RFPercentage(3),
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
    color: '#006EC2',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  sectionTitle: {
    fontSize: RFPercentage(2.2),
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  sectionContent: {
    //
  },
  itemCard: {
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  kvRow: {
    flexDirection: 'row',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  kvKey: {
    fontWeight: 'bold',
    color: '#006EC2',
    marginRight: 4,
  },
  kvValue: {
    color: '#222',
    flexShrink: 1,
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
  },
});

export default AllTablesDetailsScreen;
