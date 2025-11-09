import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { ResidentsService, Expense } from '../../src/services/residentsService';
import { PaymentService } from '../../src/services/paymentService';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import { useDrawer } from '../../src/contexts/DrawerContext';

type FilterType = 'all' | 'pending' | 'paid' | 'overdue';

export default function GastosScreen() {
  const { user } = useAuth();
  const { openDrawer } = useDrawer();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [payingExpenseId, setPayingExpenseId] = useState<string | null>(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await ResidentsService.getMyExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'No se pudieron cargar los gastos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadExpenses();
  };

  const filteredExpenses = expenses.filter((expense) => {
    if (filter === 'all') return true;
    return expense.status === filter.toUpperCase();
  });

  const stats = expenses.reduce(
    (acc, expense) => {
      acc.total++;
      acc.totalAmount += expense.amount;

      switch (expense.status) {
        case 'PAID':
          acc.paid++;
          acc.paidAmount += expense.amount;
          break;
        case 'PENDING':
          acc.pending++;
          acc.pendingAmount += expense.amount;
          break;
        case 'OVERDUE':
          acc.overdue++;
          acc.overdueAmount += expense.amount;
          break;
      }

      return acc;
    },
    {
      total: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
    },
  );

  const handlePayment = async (expenseId: string) => {
    try {
      setPayingExpenseId(expenseId);
      const response = await PaymentService.createExpensePayment(expenseId);

      if (response.checkoutUrl) {
        const canOpen = await Linking.canOpenURL(response.checkoutUrl);
        if (canOpen) {
          await Linking.openURL(response.checkoutUrl);
        } else {
          Alert.alert('Error', 'No se pudo abrir la URL de pago');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al procesar el pago');
    } finally {
      setPayingExpenseId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return '#10b981';
      case 'PENDING':
        return '#f59e0b';
      case 'OVERDUE':
        return '#ef4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Pagado';
      case 'PENDING':
        return 'Pendiente';
      case 'OVERDUE':
        return 'Vencido';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Cargando gastos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#0ea5e9', '#3b82f6']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Mis Gastos</Text>
            <Text style={styles.headerSubtitle}>Gestiona tus gastos comunes</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.headerIcon}>
              <Ionicons name="receipt" size={22} color="#FFFFFF" />
            </View>
            <TouchableOpacity
              onPress={openDrawer}
              style={styles.headerMenuButton}
              accessibilityRole="button"
              accessibilityLabel="Abrir menú"
            >
              <Ionicons name="menu" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statAmount}>${stats.totalAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
            <Text style={styles.statValue}>{stats.paid}</Text>
            <Text style={styles.statLabel}>Pagados</Text>
            <Text style={styles.statAmount}>${stats.paidAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
            <Text style={styles.statAmount}>${stats.pendingAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.statValue}>{stats.overdue}</Text>
            <Text style={styles.statLabel}>Vencidos</Text>
            <Text style={styles.statAmount}>${stats.overdueAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'pending', 'paid', 'overdue'] as FilterType[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f === 'all'
                    ? 'Todos'
                    : f === 'pending'
                      ? 'Pendientes'
                      : f === 'paid'
                        ? 'Pagados'
                        : 'Vencidos'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Expenses List */}
        <View style={styles.expensesContainer}>
          {filteredExpenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No hay gastos</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'all'
                  ? 'No tienes gastos registrados'
                  : `No tienes gastos ${filter === 'pending' ? 'pendientes' : filter === 'paid' ? 'pagados' : 'vencidos'}`}
              </Text>
            </View>
          ) : (
            filteredExpenses.map((expense) => (
              <View key={expense.id} style={styles.expenseCard}>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseConcept}>{expense.concept}</Text>
                    <View style={styles.expenseMeta}>
                      <Text style={styles.expenseDate}>
                        Vence: {new Date(expense.dueDate).toLocaleDateString('es-ES')}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(expense.status) + '20' },
                        ]}
                      >
                        <Text
                          style={[styles.statusText, { color: getStatusColor(expense.status) }]}
                        >
                          {getStatusText(expense.status)}
                        </Text>
                      </View>
                    </View>
                    {expense.description && (
                      <Text style={styles.expenseDescription}>{expense.description}</Text>
                    )}
                  </View>
                  <View style={styles.expenseAmountContainer}>
                    <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
                  </View>
                </View>
                {expense.status === 'PENDING' && (
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => handlePayment(expense.id)}
                    disabled={payingExpenseId === expense.id}
                  >
                    {payingExpenseId === expense.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="card" size={20} color="#FFFFFF" />
                        <Text style={styles.payButtonText}>Pagar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    alignItems: 'center',
    gap: 16,
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMenuButton: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  expensesContainer: {
    padding: 16,
    paddingTop: 0,
  },
  expenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseConcept: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseDate: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expenseDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
