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
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { ResidentsService, Visitor, UserUnit } from '../../src/services/residentsService';
import { Ionicons } from '@expo/vector-icons';

type FilterType = 'all' | 'PENDING' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';

export default function VisitasScreen() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visitor[]>([]);
  const [userUnits, setUserUnits] = useState<UserUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorId: '',
    visitorEmail: '',
    visitorPhone: '',
    unitId: '',
    residentName: '',
    residentPhone: '',
    visitPurpose: 'personal' as 'personal' | 'business' | 'maintenance' | 'delivery' | 'other',
    expectedArrival: '',
    expectedDeparture: '',
    vehicleInfo: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [visitsData, unitsData] = await Promise.all([
        ResidentsService.getMyVisits().catch(() => []),
        ResidentsService.getMyUnits().catch(() => []),
      ]);
      setVisits(visitsData);
      setUserUnits(unitsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredVisits = visits.filter((visit) => {
    if (filter === 'all') return true;
    return visit.status === filter;
  });

  const stats = {
    total: visits.length,
    pending: visits.filter((v) => v.status === 'PENDING').length,
    arrived: visits.filter((v) => v.status === 'ARRIVED').length,
    completed: visits.filter((v) => v.status === 'COMPLETED').length,
    cancelled: visits.filter((v) => v.status === 'CANCELLED').length,
  };

  const handleCreateVisit = async () => {
    // Validación de campos requeridos
    if (
      !formData.visitorName ||
      !formData.visitorId ||
      !formData.unitId ||
      !formData.residentName ||
      !formData.visitPurpose ||
      !formData.expectedArrival
    ) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    // Validar que la fecha de llegada no sea en el pasado
    const arrivalDate = new Date(formData.expectedArrival);
    const now = new Date();
    if (arrivalDate < now) {
      Alert.alert('Error', 'La fecha y hora de llegada no puede ser en el pasado');
      return;
    }

    // Validar que la fecha de salida sea posterior a la de llegada
    if (formData.expectedDeparture) {
      const departureDate = new Date(formData.expectedDeparture);
      if (departureDate <= arrivalDate) {
        Alert.alert('Error', 'La fecha y hora de salida debe ser posterior a la de llegada');
        return;
      }
    }

    setIsCreating(true);
    try {
      await ResidentsService.createVisit({
        visitorName: formData.visitorName,
        visitorId: formData.visitorId,
        visitorEmail: formData.visitorEmail || undefined,
        visitorPhone: formData.visitorPhone || undefined,
        unitId: formData.unitId,
        residentName: formData.residentName,
        residentPhone: formData.residentPhone || undefined,
        visitPurpose: formData.visitPurpose,
        expectedArrival: formData.expectedArrival,
        expectedDeparture: formData.expectedDeparture || undefined,
        vehicleInfo: formData.vehicleInfo || undefined,
        notes: formData.notes || undefined,
      });
      Alert.alert('Éxito', 'Visita registrada exitosamente');
      setShowCreateModal(false);
      setFormData({
        visitorName: '',
        visitorId: '',
        visitorEmail: '',
        visitorPhone: '',
        unitId: '',
        residentName: '',
        residentPhone: '',
        visitPurpose: 'personal',
        expectedArrival: '',
        expectedDeparture: '',
        vehicleInfo: '',
        notes: '',
      });
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al registrar la visita');
    } finally {
      setIsCreating(false);
    }
  };

  const handleMarkAsArrived = async (visitId: string) => {
    try {
      await ResidentsService.markVisitAsArrived(visitId);
      Alert.alert('Éxito', 'Visita marcada como llegada');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al actualizar la visita');
    }
  };

  const handleMarkAsCompleted = async (visitId: string) => {
    try {
      await ResidentsService.markVisitAsCompleted(visitId);
      Alert.alert('Éxito', 'Visita marcada como completada');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al actualizar la visita');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#10b981';
      case 'ARRIVED':
        return '#3b82f6';
      case 'PENDING':
        return '#f59e0b';
      case 'CANCELLED':
        return '#ef4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completada';
      case 'ARRIVED':
        return 'Llegó';
      case 'PENDING':
        return 'Pendiente';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getPurposeText = (purpose: string) => {
    switch (purpose) {
      case 'personal':
        return 'Personal';
      case 'business':
        return 'Negocios';
      case 'maintenance':
        return 'Mantenimiento';
      case 'delivery':
        return 'Entrega';
      case 'other':
        return 'Otro';
      default:
        return purpose;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Cargando visitas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Tus Visitas</Text>
            <Text style={styles.headerSubtitle}>Gestiona las visitas a tu unidad</Text>
          </View>
          <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
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
          </View>
          <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
            <Text style={styles.statValue}>{stats.arrived}</Text>
            <Text style={styles.statLabel}>Llegaron</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'PENDING', 'ARRIVED', 'COMPLETED', 'CANCELLED'] as FilterType[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f === 'all'
                    ? 'Todos'
                    : f === 'PENDING'
                      ? 'Pendientes'
                      : f === 'ARRIVED'
                        ? 'Llegaron'
                        : f === 'COMPLETED'
                          ? 'Completadas'
                          : 'Canceladas'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Visits List */}
        <View style={styles.visitsContainer}>
          {filteredVisits.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No hay visitas</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'all'
                  ? 'No tienes visitas registradas'
                  : `No tienes visitas ${filter === 'PENDING' ? 'pendientes' : filter === 'ARRIVED' ? 'que hayan llegado' : filter === 'COMPLETED' ? 'completadas' : 'canceladas'}`}
              </Text>
            </View>
          ) : (
            filteredVisits.map((visit) => (
              <View key={visit.id} style={styles.visitCard}>
                <View style={styles.visitHeader}>
                  <View style={styles.visitInfo}>
                    <Text style={styles.visitName}>{visit.visitorName}</Text>
                    <Text style={styles.visitUnit}>
                      Unidad {visit.unit?.number || 'N/A'}
                      {visit.unit?.floor && ` - Piso ${visit.unit.floor}`}
                    </Text>
                    <Text style={styles.visitCommunity}>{visit.unit?.community.name || 'N/A'}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(visit.status) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(visit.status) }]}>
                      {getStatusText(visit.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.visitDetails}>
                  <View style={styles.visitDetail}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.visitDetailText}>
                      {new Date(visit.visitDate).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  {visit.arrivalTime && (
                    <View style={styles.visitDetail}>
                      <Ionicons name="time" size={16} color="#6B7280" />
                      <Text style={styles.visitDetailText}>
                        Llegada:{' '}
                        {new Date(visit.arrivalTime).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  )}
                  {visit.departureTime && (
                    <View style={styles.visitDetail}>
                      <Ionicons name="time-outline" size={16} color="#6B7280" />
                      <Text style={styles.visitDetailText}>
                        Salida:{' '}
                        {new Date(visit.departureTime).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  )}
                  <View style={styles.visitDetail}>
                    <Ionicons name="call" size={16} color="#6B7280" />
                    <Text style={styles.visitDetailText}>{visit.visitorPhone}</Text>
                  </View>
                  {visit.visitorEmail && (
                    <View style={styles.visitDetail}>
                      <Ionicons name="mail" size={16} color="#6B7280" />
                      <Text style={styles.visitDetailText}>{visit.visitorEmail}</Text>
                    </View>
                  )}
                  <View style={styles.visitDetail}>
                    <Ionicons name="briefcase" size={16} color="#6B7280" />
                    <Text style={styles.visitDetailText}>{getPurposeText(visit.purpose)}</Text>
                  </View>
                </View>
                {visit.status === 'PENDING' && (
                  <View style={styles.visitActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleMarkAsArrived(visit.id)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                      <Text style={styles.actionButtonText}>Marcar como llegada</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {visit.status === 'ARRIVED' && (
                  <View style={styles.visitActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleMarkAsCompleted(visit.id)}
                    >
                      <Ionicons name="checkmark-done-circle" size={20} color="#10b981" />
                      <Text style={styles.actionButtonText}>Marcar como completada</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Visita</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Información del Visitante */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Información del Visitante</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nombre del Visitante *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Juan Pérez, María García..."
                  value={formData.visitorName}
                  onChangeText={(text) => setFormData({ ...formData, visitorName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Identificación *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 12345678, ABC123456..."
                  value={formData.visitorId}
                  onChangeText={(text) => setFormData({ ...formData, visitorId: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Teléfono del Visitante</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: +52 55 1234 5678"
                  value={formData.visitorPhone}
                  onChangeText={(text) => setFormData({ ...formData, visitorPhone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email del Visitante</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: juan.perez@email.com"
                  value={formData.visitorEmail}
                  onChangeText={(text) => setFormData({ ...formData, visitorEmail: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Información del Residente */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Información del Residente</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Unidad *</Text>
                {userUnits.map((userUnit) => (
                  <TouchableOpacity
                    key={userUnit.id}
                    style={[
                      styles.optionButton,
                      formData.unitId === userUnit.unit.id && styles.optionButtonSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, unitId: userUnit.unit.id })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData.unitId === userUnit.unit.id && styles.optionTextSelected,
                      ]}
                    >
                      Unidad {userUnit.unit.number}
                      {userUnit.unit.floor && ` - Piso ${userUnit.unit.floor}`} (
                      {userUnit.unit.community.name})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nombre del Residente *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Carlos López, Ana Martínez..."
                  value={formData.residentName}
                  onChangeText={(text) => setFormData({ ...formData, residentName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Teléfono del Residente</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: +52 55 9876 5432"
                  value={formData.residentPhone}
                  onChangeText={(text) => setFormData({ ...formData, residentPhone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Detalles de la Visita */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Detalles de la Visita</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Propósito de la Visita *</Text>
                {(['personal', 'business', 'maintenance', 'delivery', 'other'] as const).map(
                  (purpose) => (
                    <TouchableOpacity
                      key={purpose}
                      style={[
                        styles.optionButton,
                        formData.visitPurpose === purpose && styles.optionButtonSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, visitPurpose: purpose })}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          formData.visitPurpose === purpose && styles.optionTextSelected,
                        ]}
                      >
                        {getPurposeText(purpose)}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Fecha y Hora de Llegada *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DDTHH:MM (ej: 2024-12-25T14:30)"
                  value={formData.expectedArrival}
                  onChangeText={(text) => setFormData({ ...formData, expectedArrival: text })}
                />
                <Text style={styles.formHint}>
                  Formato: YYYY-MM-DDTHH:MM (ej: 2024-12-25T14:30)
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Fecha y Hora de Salida</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DDTHH:MM (ej: 2024-12-25T18:00)"
                  value={formData.expectedDeparture}
                  onChangeText={(text) => setFormData({ ...formData, expectedDeparture: text })}
                />
                <Text style={styles.formHint}>
                  Formato: YYYY-MM-DDTHH:MM (ej: 2024-12-25T18:00)
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Información del Vehículo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Toyota Corolla ABC-123, Moto Honda XYZ-456..."
                  value={formData.vehicleInfo}
                  onChangeText={(text) => setFormData({ ...formData, vehicleInfo: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notas Adicionales</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Información adicional sobre la visita..."
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateVisit}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Registrar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  visitsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  visitCard: {
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
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  visitInfo: {
    flex: 1,
  },
  visitName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  visitUnit: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  visitCommunity: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  visitDetails: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  visitDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  visitDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  visitActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  formHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  optionButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 14,
    color: '#111827',
  },
  optionTextSelected: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
