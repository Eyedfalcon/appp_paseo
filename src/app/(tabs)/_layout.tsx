import { Tabs } from "expo-router";
import { Icon } from "../../components/ui";
import { C } from "../../lib/theme";
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.lightText,
        tabBarStyle: { backgroundColor: C.navy, borderTopWidth: 0 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarItemStyle: { paddingVertical: 5 },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "PaseoYa",
          tabBarIcon: ({ color }) => (
            <Icon name="bag-handle-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="points"
        options={{
          title: "Puntos",
          tabBarIcon: ({ color }) => (
            <Icon name="sparkles-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Descubrir",
          tabBarIcon: ({ color }) => (
            <Icon name="compass-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Mi perfil",
          tabBarIcon: ({ color }) => (
            <Icon name="person-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
