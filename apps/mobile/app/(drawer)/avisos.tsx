import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../../src/contexts/AuthContext';
import { ResidentsService, Announcement } from '../../src/services/residentsService';
import { Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../../src/contexts/DrawerContext';

export default function AvisosScreen() {
  const { user } = useAuth();
  const { openDrawer } = useDrawer();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'INFO' | 'WARNING' | 'URGENT' | 'EVENT'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ResidentsService.getMyAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.log('Error loading announcements:', error);
      setError('No pudimos cargar los avisos. Intenta nuevamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnnouncements();
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (filter === 'all') return true;
    return announcement.type === filter;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'URGENT':
        return '#ef4444';
      case 'WARNING':
        return '#f59e0b';
      case 'EVENT':
        return '#8b5cf6';
      case 'INFO':
      default:
        return '#3b82f6';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'URGENT':
        return 'alert-circle';
      case 'WARNING':
        return 'warning';
      case 'EVENT':
        return 'calendar';
      case 'INFO':
      default:
        return 'information-circle';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'URGENT':
        return 'Urgente';
      case 'WARNING':
        return 'Advertencia';
      case 'EVENT':
        return 'Evento';
      case 'INFO':
      default:
        return 'Información';
    }
  };

  const stats = {
    total: announcements.length,
    info: announcements.filter((a) => a.type === 'INFO').length,
    warning: announcements.filter((a) => a.type === 'WARNING').length,
    urgent: announcements.filter((a) => a.type === 'URGENT').length,
    event: announcements.filter((a) => a.type === 'EVENT').length,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Cargando avisos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#f59e0b', '#ef4444']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Avisos</Text>
            <Text style={styles.headerSubtitle}>Información importante de tu comunidad</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.headerIcon}>
              <Ionicons name="megaphone" size={24} color="#FFFFFF" />
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
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={18} color="#B45309" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
            <Text style={styles.statValue}>{stats.info}</Text>
            <Text style={styles.statLabel}>Información</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.statValue}>{stats.warning}</Text>
            <Text style={styles.statLabel}>Advertencias</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.statValue}>{stats.urgent}</Text>
            <Text style={styles.statLabel}>Urgentes</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'INFO', 'WARNING', 'URGENT', 'EVENT'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f === 'all'
                    ? 'Todos'
                    : f === 'INFO'
                      ? 'Información'
                      : f === 'WARNING'
                        ? 'Advertencias'
                        : f === 'URGENT'
                          ? 'Urgentes'
                          : 'Eventos'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Announcements List */}
        <View style={styles.announcementsContainer}>
          {filteredAnnouncements.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No hay avisos</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'all'
                  ? 'No hay avisos disponibles en este momento'
                  : `No hay avisos de tipo ${filter === 'INFO' ? 'información' : filter === 'WARNING' ? 'advertencia' : filter === 'URGENT' ? 'urgente' : 'evento'}`}
              </Text>
            </View>
          ) : (
            filteredAnnouncements.map((announcement) => {
              const typeColor = getTypeColor(announcement.type);
              const typeIcon = getTypeIcon(announcement.type);
              const isExpired =
                announcement.expiresAt && new Date(announcement.expiresAt) < new Date();

              return (
                <View key={announcement.id} style={styles.announcementCard}>
                  <View style={styles.announcementHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
                      <Ionicons name={typeIcon} size={16} color={typeColor} />
                      <Text style={[styles.typeText, { color: typeColor }]}>
                        {getTypeText(announcement.type)}
                      </Text>
                    </View>
                    {isExpired && (
                      <View style={styles.expiredBadge}>
                        <Text style={styles.expiredText}>Expirado</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.announcementTitle}>{announcement.title}</Text>
                  <Text style={styles.announcementContent}>{announcement.content}</Text>
                  <View style={styles.announcementFooter}>
                    <View style={styles.announcementInfo}>
                      <Ionicons name="business" size={14} color="#6B7280" />
                      <Text style={styles.announcementInfoText}>
                        {announcement.community?.name || 'Comunidad'}
                      </Text>
                    </View>
                    <View style={styles.announcementInfo}>
                      <Ionicons name="calendar" size={14} color="#6B7280" />
                      <Text style={styles.announcementInfoText}>
                        {new Date(announcement.publishedAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    {announcement.expiresAt && (
                      <View style={styles.announcementInfo}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.announcementInfoText}>
                          Expira:{' '}
                          {new Date(announcement.expiresAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#B45309',
    fontWeight: '600',
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
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  announcementsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  announcementCard: {
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
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expiredBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expiredText: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  announcementContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  announcementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  announcementInfoText: {
    fontSize: 12,
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
});
