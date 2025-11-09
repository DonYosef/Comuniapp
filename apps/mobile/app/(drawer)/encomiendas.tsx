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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { ParcelsService, Parcel } from '../../src/services/parcelsService';
import { Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../../src/contexts/DrawerContext';

type FilterType = 'all' | 'RECEIVED' | 'RETRIEVED' | 'EXPIRED';

export default function EncomiendasScreen() {
  const { user } = useAuth();
  const { openDrawer } = useDrawer();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadParcels();
  }, []);

  const loadParcels = async () => {
    try {
      setLoading(true);
      const data = await ParcelsService.getMyParcels();
      setParcels(data);
    } catch (error) {
      console.error('Error loading parcels:', error);
      Alert.alert('Error', 'No se pudieron cargar las encomiendas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadParcels();
  };

  const filteredParcels = parcels.filter((parcel) => {
    if (filter === 'all') return true;
    return parcel.status === filter;
  });

  const stats = {
    total: parcels.length,
    received: parcels.filter((p) => p.status === 'RECEIVED').length,
    retrieved: parcels.filter((p) => p.status === 'RETRIEVED').length,
    expired: parcels.filter((p) => p.status === 'EXPIRED').length,
  };

  const handleMarkAsRetrieved = async (id: string) => {
    try {
      await ParcelsService.markAsRetrieved(id);
      Alert.alert('Éxito', 'Encomienda marcada como retirada');
      await loadParcels();
      setShowDetailModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al actualizar la encomienda');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RETRIEVED':
        return '#10b981';
      case 'RECEIVED':
        return '#3b82f6';
      case 'EXPIRED':
        return '#ef4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RETRIEVED':
        return 'Retirada';
      case 'RECEIVED':
        return 'Recibida';
      case 'EXPIRED':
        return 'Vencida';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RETRIEVED':
        return 'checkmark-circle';
      case 'RECEIVED':
        return 'cube';
      case 'EXPIRED':
        return 'alert-circle';
      default:
        return 'cube-outline';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Cargando encomiendas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Mis Encomiendas</Text>
            <Text style={styles.headerSubtitle}>Gestiona tus paquetes recibidos</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.headerIcon}>
              <Ionicons name="cube" size={22} color="#FFFFFF" />
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
            <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.statCardGradient}>
              <Ionicons name="cube" size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient colors={['#3b82f6', '#0ea5e9']} style={styles.statCardGradient}>
              <Ionicons name="cube-outline" size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{stats.received}</Text>
              <Text style={styles.statLabel}>Recibidas</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient colors={['#10b981', '#059669']} style={styles.statCardGradient}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{stats.retrieved}</Text>
              <Text style={styles.statLabel}>Retiradas</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.statCardGradient}>
              <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{stats.expired}</Text>
              <Text style={styles.statLabel}>Vencidas</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'RECEIVED', 'RETRIEVED', 'EXPIRED'] as FilterType[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f === 'all'
                    ? 'Todas'
                    : f === 'RECEIVED'
                      ? 'Recibidas'
                      : f === 'RETRIEVED'
                        ? 'Retiradas'
                        : 'Vencidas'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Parcels List */}
        <View style={styles.parcelsContainer}>
          {filteredParcels.length === 0 ? (
            <View style={styles.emptyContainer}>
              <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.emptyIconContainer}>
                <Ionicons name="cube-outline" size={64} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.emptyText}>No hay encomiendas</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'all'
                  ? 'No tienes encomiendas registradas'
                  : `No tienes encomiendas ${filter === 'RECEIVED' ? 'recibidas' : filter === 'RETRIEVED' ? 'retiradas' : 'vencidas'}`}
              </Text>
            </View>
          ) : (
            filteredParcels.map((parcel) => (
              <TouchableOpacity
                key={parcel.id}
                style={styles.parcelCard}
                onPress={() => {
                  setSelectedParcel(parcel);
                  setShowDetailModal(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.parcelHeader}>
                  <View style={styles.parcelIconContainer}>
                    <LinearGradient
                      colors={[
                        getStatusColor(parcel.status) + '20',
                        getStatusColor(parcel.status) + '40',
                      ]}
                      style={styles.parcelIconGradient}
                    >
                      <Ionicons
                        name={getStatusIcon(parcel.status) as any}
                        size={24}
                        color={getStatusColor(parcel.status)}
                      />
                    </LinearGradient>
                  </View>
                  <View style={styles.parcelInfo}>
                    <Text style={styles.parcelDescription} numberOfLines={2}>
                      {parcel.description || 'Sin descripción'}
                    </Text>
                    <Text style={styles.parcelUnit}>
                      Unidad {parcel.unitNumber} - {parcel.communityName}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(parcel.status) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(parcel.status) }]}>
                      {getStatusText(parcel.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.parcelDetails}>
                  {parcel.sender && (
                    <View style={styles.parcelDetail}>
                      <Ionicons name="person" size={16} color="#6B7280" />
                      <Text style={styles.parcelDetailText}>De: {parcel.sender}</Text>
                    </View>
                  )}
                  <View style={styles.parcelDetail}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.parcelDetailText}>
                      Recibida: {new Date(parcel.receivedAt).toLocaleDateString('es-ES')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de Encomienda</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedParcel && (
                <>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Descripción</Text>
                    <Text style={styles.detailValue}>
                      {selectedParcel.description || 'Sin descripción'}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Unidad</Text>
                    <Text style={styles.detailValue}>
                      {selectedParcel.unitNumber} - {selectedParcel.communityName}
                    </Text>
                  </View>

                  {selectedParcel.sender && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Remitente</Text>
                      <Text style={styles.detailValue}>{selectedParcel.sender}</Text>
                      {selectedParcel.senderPhone && (
                        <Text style={styles.detailSubValue}>{selectedParcel.senderPhone}</Text>
                      )}
                    </View>
                  )}

                  {selectedParcel.recipientName && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Destinatario</Text>
                      <Text style={styles.detailValue}>{selectedParcel.recipientName}</Text>
                      {selectedParcel.recipientPhone && (
                        <Text style={styles.detailSubValue}>{selectedParcel.recipientPhone}</Text>
                      )}
                    </View>
                  )}

                  {selectedParcel.conciergeName && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Recibido por</Text>
                      <Text style={styles.detailValue}>{selectedParcel.conciergeName}</Text>
                      {selectedParcel.conciergePhone && (
                        <Text style={styles.detailSubValue}>{selectedParcel.conciergePhone}</Text>
                      )}
                    </View>
                  )}

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Fecha de Recepción</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedParcel.receivedAt).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  {selectedParcel.retrievedAt && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Fecha de Retiro</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedParcel.retrievedAt).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  )}

                  {selectedParcel.notes && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Notas</Text>
                      <Text style={styles.detailValue}>{selectedParcel.notes}</Text>
                    </View>
                  )}

                  <View style={styles.detailSection}>
                    <View
                      style={[
                        styles.statusBadgeLarge,
                        { backgroundColor: getStatusColor(selectedParcel.status) + '20' },
                      ]}
                    >
                      <Ionicons
                        name={getStatusIcon(selectedParcel.status) as any}
                        size={20}
                        color={getStatusColor(selectedParcel.status)}
                      />
                      <Text
                        style={[
                          styles.statusTextLarge,
                          { color: getStatusColor(selectedParcel.status) },
                        ]}
                      >
                        {getStatusText(selectedParcel.status)}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {selectedParcel && selectedParcel.status === 'RECEIVED' && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.retrieveButton}
                  onPress={() => handleMarkAsRetrieved(selectedParcel.id)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.retrieveButtonText}>Marcar como Retirada</Text>
                </TouchableOpacity>
              </View>
            )}
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
    minHeight: 120,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
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
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  parcelsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  parcelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  parcelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  parcelIconContainer: {
    marginRight: 12,
  },
  parcelIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parcelInfo: {
    flex: 1,
  },
  parcelDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  parcelUnit: {
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
  parcelDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  parcelDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  parcelDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  detailSubValue: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  statusTextLarge: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  retrieveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  retrieveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
