import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  ResidentsService,
  Expense,
  Reservation,
  Visitor,
} from '../../src/services/residentsService';
import { ParcelsService } from '../../src/services/parcelsService';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingExpenses: 0,
    totalReservations: 0,
    pendingReservations: 0,
    totalVisits: 0,
    pendingVisits: 0,
    totalParcels: 0,
    receivedParcels: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [expenses, reservations, visits, parcels] = await Promise.all([
        ResidentsService.getMyExpenses().catch(() => []),
        ResidentsService.getMyReservations().catch(() => []),
        ResidentsService.getMyVisits().catch(() => []),
        ParcelsService.getMyParcels().catch(() => []),
      ]);

      setStats({
        totalExpenses: expenses.length,
        pendingExpenses: expenses.filter((e) => e.status === 'PENDING' || e.status === 'OVERDUE')
          .length,
        totalReservations: reservations.length,
        pendingReservations: reservations.filter((r) => r.status === 'PENDING').length,
        totalVisits: visits.length,
        pendingVisits: visits.filter((v) => v.status === 'PENDING').length,
        totalParcels: parcels.length,
        receivedParcels: parcels.filter((p) => p.status === 'RECEIVED').length,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <LinearGradient
          colors={['#0ea5e9', '#3b82f6', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>¡Hola!</Text>
              <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/gastos')}
            activeOpacity={0.7}
          >
            <LinearGradient colors={['#10b981', '#059669']} style={styles.statCardGradient}>
              <Ionicons name="receipt" size={32} color="#FFFFFF" />
              <Text style={styles.statValue}>{stats.totalExpenses}</Text>
              <Text style={styles.statLabel}>Gastos Totales</Text>
              {stats.pendingExpenses > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats.pendingExpenses} pendientes</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/reservas')}
            activeOpacity={0.7}
          >
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.statCardGradient}>
              <Ionicons name="calendar" size={32} color="#FFFFFF" />
              <Text style={styles.statValue}>{stats.totalReservations}</Text>
              <Text style={styles.statLabel}>Reservas</Text>
              {stats.pendingReservations > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats.pendingReservations} pendientes</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/visitas')}
            activeOpacity={0.7}
          >
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.statCardGradient}>
              <Ionicons name="people" size={32} color="#FFFFFF" />
              <Text style={styles.statValue}>{stats.totalVisits}</Text>
              <Text style={styles.statLabel}>Visitas</Text>
              {stats.pendingVisits > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats.pendingVisits} pendientes</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(tabs)/encomiendas')}
            activeOpacity={0.7}
          >
            <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.statCardGradient}>
              <Ionicons name="cube" size={32} color="#FFFFFF" />
              <Text style={styles.statValue}>{stats.totalParcels}</Text>
              <Text style={styles.statLabel}>Encomiendas</Text>
              {stats.receivedParcels > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats.receivedParcels} recibidas</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/gastos')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#10b981' }]}>
                <Ionicons name="receipt-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Ver Gastos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/reservas')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#3b82f6' }]}>
                <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Mis Reservas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/visitas')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#8b5cf6' }]}>
                <Ionicons name="people-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Tus Visitas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/encomiendas')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#6366f1' }]}>
                <Ionicons name="cube-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.quickActionText}>Encomiendas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Info */}
        {user?.userUnits && user.userUnits.length > 0 && (
          <View style={styles.userInfoContainer}>
            <Text style={styles.sectionTitle}>Mis Unidades</Text>
            {user.userUnits.map((userUnit) => (
              <View key={userUnit.id} style={styles.unitCard}>
                <Ionicons name="home" size={24} color="#0ea5e9" />
                <View style={styles.unitInfo}>
                  <Text style={styles.unitNumber}>
                    Unidad {userUnit.unit.number}
                    {userUnit.unit.floor && ` - Piso ${userUnit.unit.floor}`}
                  </Text>
                  <Text style={styles.unitCommunity}>{userUnit.unit.community.name}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
  },
  badge: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  quickActionsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  userInfoContainer: {
    padding: 16,
    paddingTop: 0,
  },
  unitCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  unitInfo: {
    marginLeft: 12,
    flex: 1,
  },
  unitNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  unitCommunity: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});
