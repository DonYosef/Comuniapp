import { Stack, useRouter, usePathname } from 'expo-router';
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { DrawerProvider, useDrawer } from '../../src/contexts/DrawerContext';

// Componente del menú lateral - recibe router y pathname como props
function DrawerMenu({
  router,
  pathname,
}: {
  router: ReturnType<typeof useRouter>;
  pathname: string;
}) {
  const { isOpen, closeDrawer } = useDrawer();
  const { user, logout } = useAuth();

  const navigateTo = (route: string) => {
    try {
      router.push(`/(drawer)/${route}` as any);
    } catch (error) {
      console.error('Error navigating:', error);
      // Fallback: usar replace si push falla
      try {
        router.replace(`/(drawer)/${route}` as any);
      } catch (replaceError) {
        console.error('Error en replace también:', replaceError);
      }
    }
    closeDrawer();
  };

  const handleLogout = async () => {
    await logout();
    closeDrawer();
  };

  const menuItems = [
    { route: 'dashboard', label: 'Inicio', icon: 'home', color: '#0ea5e9' },
    { route: 'avisos', label: 'Avisos', icon: 'megaphone', color: '#f59e0b' },
    { route: 'gastos', label: 'Mis Gastos', icon: 'receipt', color: '#10b981' },
    { route: 'reservas', label: 'Reservas', icon: 'calendar', color: '#3b82f6' },
    { route: 'visitas', label: 'Visitas', icon: 'people', color: '#8b5cf6' },
    { route: 'encomiendas', label: 'Encomiendas', icon: 'cube', color: '#6366f1' },
  ];

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={closeDrawer}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={closeDrawer} />

        <View style={styles.drawerContainer}>
          {/* Header del Drawer */}
          <LinearGradient colors={['#0ea5e9', '#3b82f6', '#8b5cf6']} style={styles.drawerHeader}>
            <View style={styles.drawerHeaderContent}>
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {user?.email || ''}
                </Text>
              </View>
              <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={styles.drawerBody}>
            <ScrollView
              style={styles.drawerScroll}
              contentContainerStyle={styles.drawerContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionTitle}>Menú principal</Text>
              {menuItems.map((item) => {
                const isActive = pathname === `/(drawer)/${item.route}`;
                return (
                  <TouchableOpacity
                    key={item.route}
                    style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                    onPress={() => navigateTo(item.route)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={item.icon as any} size={24} color={item.color} />
                    <Text style={styles.drawerItemText}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.drawerFooter}>
              <TouchableOpacity
                style={[styles.drawerItem, styles.logoutItem]}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                <Text style={[styles.drawerItemText, styles.logoutText]}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DrawerLayoutContent() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen
        name="avisos"
        options={{
          title: 'Avisos',
        }}
      />
      <Stack.Screen
        name="gastos"
        options={{
          title: 'Mis Gastos',
        }}
      />
      <Stack.Screen
        name="reservas"
        options={{
          title: 'Reservas',
        }}
      />
      <Stack.Screen
        name="visitas"
        options={{
          title: 'Visitas',
        }}
      />
      <Stack.Screen
        name="encomiendas"
        options={{
          title: 'Encomiendas',
        }}
      />
    </Stack>
  );
}

// Wrapper que obtiene router y pathname dentro del contexto del Stack
function DrawerLayoutWithMenu() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <DrawerLayoutContent />
      <DrawerMenu router={router} pathname={pathname} />
    </>
  );
}

export default function DrawerLayout() {
  return (
    <DrawerProvider>
      <DrawerLayoutWithMenu />
    </DrawerProvider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: 280,
    height: '100%',
    backgroundColor: '#FFFFFF',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  drawerHeader: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: 24,
  },
  drawerHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  closeButton: {
    padding: 4,
  },
  drawerBody: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  drawerScroll: {
    flex: 1,
  },
  drawerContentContainer: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginHorizontal: 24,
    marginBottom: 8,
    marginTop: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
    gap: 12,
  },
  drawerItemActive: {
    backgroundColor: '#F3F4F6',
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: '#FFFFFF',
  },
  logoutItem: {
    marginHorizontal: 0,
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    color: '#ef4444',
  },
});
