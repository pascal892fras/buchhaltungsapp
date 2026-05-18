# 📱 MOBILE-PORTIERUNG: DETAILLIERTE ROADMAP

## 🎯 EMPFEHLUNG: REACT NATIVE (Expo)

Warum?
- ✅ 70-80% Code-Reuse vom bestehenden JavaScript
- ✅ Schnelle Entwicklung (Hot Reload)
- ✅ Funktioniert auf iOS + Android
- ✅ Native Performance
- ✅ Große Community & Ecosystem
- ✅ Einfaches Deployment (Expo Go zum Testen)

**Gesamtaufwand: 250-350 Stunden**
**Zeitrahmen: 6-8 Wochen (mit 1 Developer)**

---

## 📊 PHASEN-BREAKDOWN

### PHASE 0: Vorbereitung (1 Woche) - VORHER STARTEN!
**Wichtig: Das MUSS vor Mobile-Portierung gemacht werden!**

- [x] Error Handling in allen kritischen Funktionen
- [x] Input-Validierung (Utility-Funktionen)
- [x] Code-Duplikate entfernen
- [x] Tests für Core-Logik (state.js, validation.js)
- [x] TypeScript ggfs. einführen (optional aber empfohlen)

**Aufwand:** 40-60 Stunden
**Benefit:** Code ist wartbar für beide Plattformen

```bash
npm run lint:fix       # Code aufräumen
npm run test:coverage  # Tests schreiben
npm run format         # Formatieren
```

---

### PHASE 1: React Native Projekt Setup (1 Woche)

#### Schritt 1: Projekt initialisieren
```bash
# Option A: Mit Expo (einfacher, empfohlen)
npx create-expo-app BuchhaltungMobile
cd BuchhaltungMobile
npm install

# Option B: Mit React Native CLI
npx @react-native-community/cli init BuchhaltungMobile
```

#### Schritt 2: Dependencies installieren
```bash
npm install \
  @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack \
  zustand axios \
  react-native-paper \
  @react-native-async-storage/async-storage \
  react-native-svg react-native-svg-transformer \
  react-native-gesture-handler \
  react-native-reanimated
```

#### Schritt 3: Projektstruktur aufbauen
```
src/
├── api/              # Axios/HTTP (shared mit Web)
├── stores/           # Zustand State (neu für RN)
├── screens/          # RN Screen Components
│   ├── DashboardScreen.js
│   ├── RechnungenScreen.js
│   ├── KundenScreen.js
│   ├── AusgabenScreen.js
│   └── SettingsScreen.js
├── components/       # Reusable Components
│   ├── FormInput.js
│   ├── DataTable.js
│   ├── FAB.js
│   └── ...
├── hooks/           # Custom Hooks
├── utils/           # Shared Utilities (von Web)
├── navigation/      # Navigation Setup
└── App.js           # Root Component
```

---

### PHASE 2: State Management + Storage (1 Woche)

#### Zustand Store (RN-compatible)
```javascript
// src/stores/appStore.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAppStore = create((set) => ({
  // State
  kunden: [],
  rechnungen: [],
  ausgaben: [],
  settings: {},

  // Actions
  loadData: async () => {
    try {
      const data = await AsyncStorage.getItem('buchhaltung_data');
      set(JSON.parse(data) || {});
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    }
  },

  saveData: async () => {
    try {
      await AsyncStorage.setItem('buchhaltung_data', JSON.stringify(this));
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  }
}));
```

#### Local Storage Alternative zu browser localStorage
```javascript
// utils/storage.js (Web + RN kompatibel)
let StorageProvider;

if (Platform.OS === 'web') {
  StorageProvider = localStorage;
} else {
  StorageProvider = AsyncStorage;
}

export const storage = {
  getItem: (key) => StorageProvider.getItem(key),
  setItem: (key, value) => StorageProvider.setItem(key, value),
  removeItem: (key) => StorageProvider.removeItem(key),
  clear: () => StorageProvider.clear(),
};
```

---

### PHASE 3: Screen-Komponenten (2-3 Wochen)

#### Dashboard Screen
```javascript
// src/screens/DashboardScreen.js
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useAppStore } from '../stores/appStore';

export default function DashboardScreen() {
  const { kunden, rechnungen, ausgaben } = useAppStore();
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    // Berechne Metriken
    const einnahmen = rechnungen.reduce((sum, r) => sum + r.betrag, 0);
    const kosten = ausgaben.reduce((sum, a) => sum + a.betrag, 0);
    setMetrics({
      einnahmen: einnahmen.toFixed(2),
      kosten: kosten.toFixed(2),
      gewinn: (einnahmen - kosten).toFixed(2),
      kundenCount: kunden.length
    });
  }, [kunden, rechnungen, ausgaben]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.metricsGrid}>
        <MetricCard label="Einnahmen (Jahr)" value={`€ ${metrics.einnahmen}`} />
        <MetricCard label="Ausgaben (Jahr)" value={`€ ${metrics.kosten}`} />
        <MetricCard label="Gewinn (Jahr)" value={`€ ${metrics.gewinn}`} />
        <MetricCard label="Kunden" value={metrics.kundenCount} />
      </View>

      {/* Weitere Widgets */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  metricsGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  }
});
```

#### Rechnungen Screen (mit List + Form)
```javascript
// src/screens/RechnungenScreen.js
import React, { useState } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl
} from 'react-native';
import { FAB, Dialog, Button } from 'react-native-paper';
import RechnungListItem from '../components/RechnungListItem';
import RechnungForm from '../components/RechnungForm';
import { useAppStore } from '../stores/appStore';

export default function RechnungenScreen() {
  const { rechnungen, deleteRechnung, addRechnung } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (data) => {
    addRechnung(data);
    setShowForm(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={rechnungen}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RechnungListItem
            rechnung={item}
            onDelete={() => deleteRechnung(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => {}} />
        }
      />

      <FAB
        icon="plus"
        onPress={() => setShowForm(true)}
        style={styles.fab}
      />

      <RechnungForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleAdd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0
  }
});
```

#### Ausgaben Screen mit OCR-Kamera
```javascript
// src/screens/AusgabenScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Modal, StyleSheet, Platform
} from 'react-native';
import { Camera } from 'expo-camera';
import { Button, TextInput } from 'react-native-paper';
import { useAppStore } from '../stores/appStore';

export default function AusgabenScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestPermission] = Camera.useCameraPermissions();
  const cameraRef = useRef();
  const { addAusgabe } = useAppStore();

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync();
      // Sende zu OCR-Service (lokal mit MLKit oder Tesseract)
      const ocrResult = await performOCR(photo.uri);
      
      // Befülle Form mit erkannten Daten
      setShowCamera(false);
      // Zeige Form mit OCR-Ergebnissen
    } catch (error) {
      console.error('Kamera-Fehler:', error);
    }
  };

  const performOCR = async (imageUri) => {
    // Option 1: Google ML Kit (schneller, native)
    // Option 2: Tesseract.js (langsamer, aber bekannt)
    // Wir würden ML Kit verwenden für Mobile
  };

  return (
    <View style={styles.container}>
      <Button
        icon="camera"
        mode="contained"
        onPress={() => setShowCamera(true)}
      >
        Beleg fotografieren
      </Button>

      <Modal visible={showCamera} animationType="slide">
        {cameraPermission?.granted ? (
          <Camera ref={cameraRef} style={styles.camera}>
            <View style={styles.cameraButtons}>
              <Button
                icon="close"
                onPress={() => setShowCamera(false)}
              />
              <Button
                icon="check"
                onPress={handleCapture}
              />
            </View>
          </Camera>
        ) : (
          <Button onPress={requestPermission} label="Kamera erlauben" />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  camera: {
    flex: 1
  },
  cameraButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16
  }
});
```

---

### PHASE 4: Navigation Setup (3-4 Tage)

```javascript
// src/navigation/RootNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import DashboardScreen from '../screens/DashboardScreen';
import RechnungenScreen from '../screens/RechnungenScreen';
import AusgabenScreen from '../screens/AusgabenScreen';
import KundenScreen from '../screens/KundenScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function DashboardStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') iconName = 'home';
            else if (route.name === 'Rechnungen') iconName = 'file-document';
            else if (route.name === 'Ausgaben') iconName = 'wallet';
            else if (route.name === 'Kunden') iconName = 'account-multiple';
            else if (route.name === 'Settings') iconName = 'cog';

            return (
              <MaterialCommunityIcons
                name={iconName}
                size={size}
                color={color}
              />
            );
          },
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Home" component={DashboardStackNavigator} />
        <Tab.Screen name="Rechnungen" component={RechnungenScreen} />
        <Tab.Screen name="Ausgaben" component={AusgabenScreen} />
        <Tab.Screen name="Kunden" component={KundenScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

---

### PHASE 5: Advanced Features (2 Wochen)

#### PDF-Viewer
```bash
npm install react-native-pdf
```

```javascript
// src/components/PDFViewer.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import PdfView from 'react-native-pdf';

export default function PDFViewer({ uri, style }) {
  return (
    <View style={[styles.container, style]}>
      <PdfView
        source={{ uri }}
        onLoadComplete={(numberOfPages) => {
          console.log(`PDF geladen: ${numberOfPages} Seiten`);
        }}
        onPageChanged={(page, numberOfPages) => {
          console.log(`Seite ${page} von ${numberOfPages}`);
        }}
        onError={(error) => {
          console.error('PDF-Fehler:', error);
        }}
        style={styles.pdf}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pdf: {
    flex: 1,
  },
});
```

#### Push-Notifications für Rechnungserinnerungen
```bash
npm install expo-notifications
```

```javascript
// src/utils/notifications.js
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function scheduleReminderNotification(rechnung, days = 7) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rechnungserinnerung',
      body: `Rechnung ${rechnung.nummer} an ${rechnung.kunde} ist fällig`,
      data: { rechnungId: rechnung.id },
    },
    trigger: {
      seconds: days * 24 * 60 * 60,
    },
  });
}
```

#### File Share & Export
```bash
npm install react-native-share react-native-fs
```

```javascript
// src/utils/exportUtils.js
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

export async function exportAndShare(type, data) {
  try {
    const csvContent = generateCSV(data);
    const filename = `Export_${type}_${Date.now()}.csv`;
    const filepath = `${RNFS.DocumentDirectoryPath}/${filename}`;

    await RNFS.writeFile(filepath, csvContent, 'utf8');

    await Share.open({
      url: `file://${filepath}`,
      type: 'text/csv',
      title: `Exportiere ${type}`,
    });
  } catch (error) {
    console.error('Export-Fehler:', error);
  }
}

function generateCSV(data) {
  // CSV-Generation
  return data.map(row => Object.values(row).join(',')).join('\n');
}
```

---

### PHASE 6: Testing & Deployment (1-2 Wochen)

#### Testing mit Detox (E2E)
```bash
npm install detox detox-cli --save-dev
npx detox init -r ios
```

```javascript
// e2e/firstTest.e2e.js
describe('Rechnungen erstellen', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('sollte eine Rechnung erstellen können', async () => {
    await element(by.id('rechnungen-tab')).tap();
    await element(by.id('fab-add')).tap();
    await element(by.id('input-nummer')).typeText('RE-001');
    await element(by.id('input-betrag')).typeText('100.00');
    await element(by.id('btn-save')).tap();

    await expect(element(by.text('RE-001'))).toBeVisible();
  });
});
```

#### App Store Deployment
```javascript
// app.json (Expo-Konfiguration)
{
  "expo": {
    "name": "Buchhaltung",
    "slug": "buchhaltung",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "de.kleingewerbe.buchhaltung"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "de.kleingewerbe.buchhaltung"
    },
    "plugins": [
      ["expo-camera"],
      ["expo-notifications"]
    ]
  }
}
```

Build & Deploy:
```bash
# Mit Expo (einfacher)
eas login
eas build --platform ios
eas build --platform android
eas submit --platform ios
eas submit --platform android

# Oder mit Fastlane (fortgeschritten)
cd ios && fastlane ios release
cd ../android && fastlane android release
```

---

## 💾 KOSTEN & RESSOURCEN

### Entwickler-Zeit
| Phase | Aufwand | Kosten* |
|-------|---------|--------|
| Vorbereitung | 40-60h | 2-3k€ |
| Setup | 30-40h | 1.5-2k€ |
| State/Storage | 30-40h | 1.5-2k€ |
| Screens (Core) | 100-120h | 5-6k€ |
| Navigation | 20-30h | 1-1.5k€ |
| Advanced | 50-70h | 2.5-3.5k€ |
| Testing/Deploy | 50-70h | 2.5-3.5k€ |
| **TOTAL** | **320-430h** | **16-21.5k€** |

*Basierend auf 50€/Stunde Entwicklung

### Laufende Kosten
- **Expo (optional)**: €99/Monat (für EAS Builds)
- **Apple Developer**: €99/Jahr
- **Google Play Developer**: €25 (einmalig)
- **Cloud Hosting (optional)**: €50-200/Monat

---

## ✅ CHECKLIST ZUM START

### Vorbereitung (diese Woche)
- [ ] Error Handling implementieren
- [ ] Input-Validierung hinzufügen
- [ ] Tests für Core-Logik schreiben
- [ ] Code-Duplikate aufräumen
- [ ] Team/Budget bestätigen

### React Native Setup (nächste Woche)
- [ ] Expo Projekt initialisieren
- [ ] Dependencies installieren
- [ ] Projektstruktur aufbauen
- [ ] Navigation einrichten
- [ ] Erstes Deploy testen (Expo Go)

### Development (Wochen 2-6)
- [ ] Screen-Komponenten entwickeln
- [ ] State Management implementieren
- [ ] Storage-Layer integrieren
- [ ] Kamera + OCR integrieren
- [ ] PDF-Export implementieren

### Launch (Woche 7-8)
- [ ] Finale Tests durchführen
- [ ] App Store Submission vorbereiten
- [ ] Beta-Tester einladen
- [ ] Launch!

---

## 🎓 RESOURCES ZUM LERNEN

**React Native:**
- https://reactnative.dev/docs/getting-started
- https://expo.dev/documentation

**Navigation:**
- https://reactnavigation.org/

**State Management (Zustand):**
- https://github.com/pmndrs/zustand

**UI Components (Paper):**
- https://callstack.github.io/react-native-paper/

**OCR Options:**
- Google ML Kit: https://ml-kit.google.com/
- Tesseract.js: https://tesseract.projectnaptha.com/

