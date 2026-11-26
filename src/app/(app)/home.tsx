import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { AppBottomNav } from '../../components/ui/BottomNavigation';
import { LogoMark } from '../../components/ui/Logo';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Brand } from '../../constants/brand';
import { useYo } from '../../hooks/use-yo';

type IconName = keyof typeof Ionicons.glyphMap;

// Las cifras se conectarán cuando exista la base de datos que las alimente.
const INDICADORES: { titulo: string; icono: IconName; color: string }[] = [
  { titulo: 'Personas caracterizadas', icono: 'people', color: Brand.orange },
  { titulo: 'Distribución por etnia', icono: 'pie-chart', color: Brand.orange },
  { titulo: 'Distribución por barrio', icono: 'map', color: Brand.green },
  { titulo: 'Determinantes sociales de la salud', icono: 'heart', color: Brand.orange },
];

const OPORTUNIDADES: { titulo: string; icono: IconName; color: string }[] = [
  { titulo: 'Becas de educación superior', icono: 'school', color: Brand.green },
  { titulo: 'Ofertas de empleo inclusivo', icono: 'briefcase', color: Brand.orange },
  { titulo: 'Subsidios de vivienda para familias afro', icono: 'home', color: Brand.green },
];

export default function HomeScreen() {
  const { yo } = useYo();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <LogoMark size={64} />

          <View style={styles.headerText}>
            <Text style={styles.brand}>DATAFRO</Text>
            <Text style={styles.org} numberOfLines={1}>
              {yo?.organizacion.nombre ?? ' '}
            </Text>
          </View>

          <Pressable
            onPress={() => router.replace('/perfil' as Href)}
            hitSlop={10}
            accessibilityLabel="Mi perfil"
          >
            <Ionicons name="settings-sharp" size={28} color={Brand.navy} />
          </Pressable>
        </View>

        <Text style={styles.title}>Panel de Control Comunitario</Text>

        <View style={styles.grid}>
          {INDICADORES.map((item) => (
            <View key={item.titulo} style={styles.statCard}>
              <View style={styles.statTop}>
                <Ionicons name={item.icono} size={30} color={item.color} />
                <Text style={styles.statTitle}>{item.titulo}</Text>
              </View>

              <Text style={styles.statValue}>—</Text>
              <Text style={styles.soon}>Próximamente</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Boletín de Oportunidades Afro</Text>

          {OPORTUNIDADES.map((item) => (
            <View key={item.titulo} style={styles.row}>
              <Ionicons name={item.icono} size={30} color={item.color} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.titulo}</Text>
                <Text style={styles.soon}>Próximamente</Text>
              </View>
            </View>
          ))}
        </View>

        <AppButton
          title="Registrar Asistencia"
          onPress={() => router.replace('/asistencia' as Href)}
          style={styles.cta}
        />
      </ScrollView>

      <AppBottomNav active="/home" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 28,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
  },

  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: Brand.navy,
  },

  org: {
    fontSize: 16,
    color: Brand.navy,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    color: Brand.navy,
    marginBottom: 16,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },

  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderColor: Brand.navy,
    borderRadius: 20,
    padding: 14,
    minHeight: 120,
  },

  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  statTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Brand.navy,
  },

  statValue: {
    fontSize: 30,
    fontWeight: '800',
    color: Brand.navy,
    marginTop: 8,
  },

  soon: {
    fontSize: 13,
    color: Brand.muted,
    fontStyle: 'italic',
  },

  card: {
    borderWidth: 1.5,
    borderColor: Brand.navy,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    color: Brand.navy,
    paddingBottom: 10,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E8',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },

  rowText: {
    flex: 1,
  },

  rowTitle: {
    fontSize: 16,
    color: Brand.navy,
  },

  cta: {
    marginTop: 4,
  },
});
