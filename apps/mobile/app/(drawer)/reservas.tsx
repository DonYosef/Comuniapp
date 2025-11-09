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
import {
  ResidentsService,
  Reservation,
  CommonSpace,
  UserUnit,
  CreateReservationRequest,
} from '../../src/services/residentsService';
import { Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../../src/contexts/DrawerContext';

type FilterType = 'all' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export default function ReservasScreen() {
  const { user } = useAuth();
  const { openDrawer } = useDrawer();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [commonSpaces, setCommonSpaces] = useState<CommonSpace[]>([]);
  const [userUnits, setUserUnits] = useState<UserUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateReservationRequest>({
    commonSpaceId: '',
    unitId: '',
    reservationDate: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reservationsData, spacesData, unitsData] = await Promise.all([
        ResidentsService.getMyReservations().catch(() => []),
        ResidentsService.getMyCommonSpaces().catch(() => []),
        ResidentsService.getMyUnits().catch(() => []),
      ]);
      setReservations(reservationsData);
      setCommonSpaces(spacesData);
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

  const filteredReservations = reservations.filter((reservation) => {
    if (filter === 'all') return true;
    return reservation.status === filter;
  });

  const filteredCommonSpaces = formData.unitId
    ? commonSpaces.filter((space) => {
        const selectedUnit = userUnits.find((uu) => uu.unit.id === formData.unitId);
        if (!selectedUnit) return false;
        return space.communityId === selectedUnit.unit.community.id;
      })
    : commonSpaces;

  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === 'PENDING').length,
    confirmed: reservations.filter((r) => r.status === 'CONFIRMED').length,
    cancelled: reservations.filter((r) => r.status === 'CANCELLED').length,
  };

  const handleCreateReservation = async () => {
    if (
      !formData.commonSpaceId ||
      !formData.unitId ||
      !formData.reservationDate ||
      !formData.startTime ||
      !formData.endTime
    ) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    if (formData.endTime <= formData.startTime) {
      Alert.alert('Error', 'La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    const selectedDate = new Date(formData.reservationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      Alert.alert('Error', 'No puedes reservar para fechas pasadas');
      return;
    }

    setIsCreating(true);
    try {
      await ResidentsService.createReservation(formData);
      Alert.alert(
        'Éxito',
        'Solicitud de reserva creada exitosamente. El conserje revisará tu solicitud.',
      );
      setShowCreateModal(false);
      setFormData({
        commonSpaceId: '',
        unitId: '',
        reservationDate: '',
        startTime: '',
        endTime: '',
      });
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al crear la solicitud de reserva');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '#10b981';
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
      case 'CONFIRMED':
        return 'Confirmada';
      case 'PENDING':
        return 'Pendiente';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Cargando reservas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#3b82f6', '#0ea5e9']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Mis Reservas</Text>
            <Text style={styles.headerSubtitle}>Gestiona tus reservas de espacios</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.addButton}
              accessibilityRole="button"
              accessibilityLabel="Crear reserva"
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
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
          </View>
          <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
            <Text style={styles.statValue}>{stats.confirmed}</Text>
            <Text style={styles.statLabel}>Confirmadas</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.statValue}>{stats.cancelled}</Text>
            <Text style={styles.statLabel}>Canceladas</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'PENDING', 'CONFIRMED', 'CANCELLED'] as FilterType[]).map((f) => (
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
                      : f === 'CONFIRMED'
                        ? 'Confirmadas'
                        : 'Canceladas'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Reservations List */}
        <View style={styles.reservationsContainer}>
          {filteredReservations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No hay reservas</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'all'
                  ? 'No tienes reservas registradas'
                  : `No tienes reservas ${filter === 'PENDING' ? 'pendientes' : filter === 'CONFIRMED' ? 'confirmadas' : 'canceladas'}`}
              </Text>
            </View>
          ) : (
            filteredReservations.map((reservation) => (
              <View key={reservation.id} style={styles.reservationCard}>
                <View style={styles.reservationHeader}>
                  <View style={styles.reservationInfo}>
                    <Text style={styles.reservationSpace}>
                      {reservation.commonSpace?.name || 'N/A'}
                    </Text>
                    <Text style={styles.reservationUnit}>
                      Unidad {reservation.unit?.number || 'N/A'}
                      {reservation.unit?.floor && ` - Piso ${reservation.unit.floor}`}
                    </Text>
                    <Text style={styles.reservationCommunity}>
                      {reservation.unit?.community.name || 'N/A'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(reservation.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: getStatusColor(reservation.status) }]}
                    >
                      {getStatusText(reservation.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.reservationDetails}>
                  <View style={styles.reservationDetail}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.reservationDetailText}>
                      {new Date(reservation.reservationDate).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.reservationDetail}>
                    <Ionicons name="time" size={16} color="#6B7280" />
                    <Text style={styles.reservationDetailText}>
                      {reservation.startTime} - {reservation.endTime}
                    </Text>
                  </View>
                </View>
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
              <Text style={styles.modalTitle}>Nueva Reserva</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Unidad *</Text>
                <View style={styles.selectContainer}>
                  <Text style={styles.selectText}>
                    {formData.unitId
                      ? userUnits.find((uu) => uu.unit.id === formData.unitId)?.unit.number ||
                        'Selecciona'
                      : 'Selecciona una unidad'}
                  </Text>
                </View>
                {userUnits.map((userUnit) => (
                  <TouchableOpacity
                    key={userUnit.id}
                    style={styles.optionButton}
                    onPress={() =>
                      setFormData({ ...formData, unitId: userUnit.unit.id, commonSpaceId: '' })
                    }
                  >
                    <Text style={styles.optionText}>
                      Unidad {userUnit.unit.number}
                      {userUnit.unit.floor && ` - Piso ${userUnit.unit.floor}`} (
                      {userUnit.unit.community.name})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Espacio Común *</Text>
                {!formData.unitId ? (
                  <View style={styles.helperContainer}>
                    <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                    <Text style={styles.helperText}>
                      Primero selecciona una unidad para ver los espacios disponibles
                    </Text>
                  </View>
                ) : filteredCommonSpaces.length === 0 ? (
                  <View style={styles.helperContainer}>
                    <Ionicons name="alert-circle-outline" size={20} color="#f59e0b" />
                    <Text style={styles.helperText}>
                      No hay espacios comunes disponibles en esta comunidad
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.helperText}>
                      {filteredCommonSpaces.length} espacio(s) disponible(s) en tu comunidad
                    </Text>
                    <View style={styles.spacesGrid}>
                      {filteredCommonSpaces.map((space) => {
                        const isSelected = formData.commonSpaceId === space.id;
                        return (
                          <TouchableOpacity
                            key={space.id}
                            style={[styles.spaceCard, isSelected && styles.spaceCardSelected]}
                            onPress={() => setFormData({ ...formData, commonSpaceId: space.id })}
                          >
                            <View style={styles.spaceCardContent}>
                              <View
                                style={[
                                  styles.spaceIconContainer,
                                  isSelected && styles.spaceIconContainerSelected,
                                ]}
                              >
                                <Ionicons
                                  name="business-outline"
                                  size={24}
                                  color={isSelected ? '#FFFFFF' : '#0ea5e9'}
                                />
                              </View>
                              <View style={styles.spaceInfo}>
                                <Text
                                  style={[styles.spaceName, isSelected && styles.spaceNameSelected]}
                                >
                                  {space.name}
                                </Text>
                                {space.description && (
                                  <Text
                                    style={[
                                      styles.spaceDescription,
                                      isSelected && styles.spaceDescriptionSelected,
                                    ]}
                                    numberOfLines={2}
                                  >
                                    {space.description}
                                  </Text>
                                )}
                                {space.quantity && space.quantity > 1 && (
                                  <Text
                                    style={[
                                      styles.spaceQuantity,
                                      isSelected && styles.spaceQuantitySelected,
                                    ]}
                                  >
                                    Cantidad: {space.quantity}
                                  </Text>
                                )}
                              </View>
                              {isSelected && (
                                <View style={styles.selectedBadge}>
                                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Fecha *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={formData.reservationDate}
                  onChangeText={(text) => setFormData({ ...formData, reservationDate: text })}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Hora Inicio *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="HH:MM"
                    value={formData.startTime}
                    onChangeText={(text) => setFormData({ ...formData, startTime: text })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Hora Fin *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="HH:MM"
                    value={formData.endTime}
                    onChangeText={(text) => setFormData({ ...formData, endTime: text })}
                  />
                </View>
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
                onPress={handleCreateReservation}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Crear</Text>
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  reservationsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  reservationCard: {
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
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reservationInfo: {
    flex: 1,
  },
  reservationSpace: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reservationUnit: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  reservationCommunity: {
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
  reservationDetails: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reservationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reservationDetailText: {
    fontSize: 14,
    color: '#6B7280',
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
  selectContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  selectText: {
    fontSize: 16,
    color: '#111827',
  },
  optionButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    fontSize: 14,
    color: '#111827',
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginTop: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    flex: 1,
  },
  spacesGrid: {
    marginTop: 12,
    gap: 12,
  },
  spaceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  spaceCardSelected: {
    borderColor: '#0ea5e9',
    backgroundColor: '#F0F9FF',
    elevation: 4,
    shadowOpacity: 0.1,
  },
  spaceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spaceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceIconContainerSelected: {
    backgroundColor: '#0ea5e9',
  },
  spaceInfo: {
    flex: 1,
  },
  spaceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  spaceNameSelected: {
    color: '#0ea5e9',
  },
  spaceDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  spaceDescriptionSelected: {
    color: '#475569',
  },
  spaceQuantity: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  spaceQuantitySelected: {
    color: '#64748B',
  },
  selectedBadge: {
    marginLeft: 'auto',
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
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
