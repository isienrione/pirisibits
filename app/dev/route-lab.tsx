import { useEffect } from 'react'
import { Platform, StyleSheet, Text, View, Pressable, Linking } from 'react-native'

const ROUTE_LAB_URL = 'http://localhost:8791/dev/route-lab'

export default function RouteLabDevEntry() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = ROUTE_LAB_URL
    }
  }, [])

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Santiago Route Lab V0.1</Text>
      <Text style={styles.body}>
        Developer/editorial route inspection tool. Start the dev server, then open the lab.
      </Text>
      <Text style={styles.code}>npm run gate:2e:serve</Text>
      <Pressable onPress={() => Linking.openURL(ROUTE_LAB_URL)} style={styles.btn}>
        <Text style={styles.btnText}>{ROUTE_LAB_URL}</Text>
      </Pressable>
      <Text style={styles.note}>PROVISIONAL — not production routing.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 14, color: '#475569', marginBottom: 12 },
  code: { fontFamily: 'monospace', backgroundColor: '#e2e8f0', padding: 8, borderRadius: 6, marginBottom: 12 },
  btn: { backgroundColor: '#0f766e', padding: 12, borderRadius: 8, marginBottom: 12 },
  btnText: { color: '#fff', textAlign: 'center' },
  note: { color: '#b45309', fontWeight: '600' },
})
