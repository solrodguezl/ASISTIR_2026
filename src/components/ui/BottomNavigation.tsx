import { Ionicons } from '@expo/vector-icons';
import {
    Pressable,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';

export type BottomNavigationRoute = '/home' | '/perfil' ;
export type BottomNavigationIcon = 'home' | 'person';

export interface BottomNavigationItem {
  route: BottomNavigationRoute;
  active?: boolean;
  icon: BottomNavigationIcon;
}

interface BottomNavigationProps {
  items: BottomNavigationItem[];
  onNavigate: (route: BottomNavigationRoute) => void;
  style?: StyleProp<ViewStyle>;
}

export function BottomNavigation({
  items,
  onNavigate,
  style,
}: BottomNavigationProps) {
  return (
    <View style={[styles.container, style]}>
      {items.map((item) => (
        <Pressable
          key={item.route}
          onPress={() => onNavigate(item.route)}
          style={[
            styles.tab,
            item.active && styles.tabActive,
          ]}
          accessibilityRole="button"
        >
          <Ionicons
            name={item.icon}
            size={22}
            color={item.active ? '#ffffff' : '#7a7a7a'}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 6,
  },
  tab: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  tabActive: {
    backgroundColor: '#666666',
    borderColor: '#111111',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
