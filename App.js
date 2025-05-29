import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Modal, StyleSheet, Dimensions, TextInput, SafeAreaView } from 'react-native';
import Video from 'react-native-video';

import { PanGestureHandler, State,GestureHandlerRootView } from 'react-native-gesture-handler';

import SystemSetting from 'react-native-system-setting';

const { width } = Dimensions.get('window');

import { channels } from './channels';


export default function App() {

  const channelData = channels;
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [brightness, setBrightness] = useState(0);
  const [volume, setVolume] = useState(0);
  const [showOverlay, setShowOverlay] = useState(null);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const overlayTimeoutRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const initSettings = async () => {
      setVolume(await SystemSetting.getVolume());
      setBrightness(await SystemSetting.getBrightness());
    };
    initSettings();
  }, []);

  const handleGesture = ({ nativeEvent }) => {


    const { translationY, absoluteX, state } = nativeEvent;
    if (state !== State.ACTIVE) return;

    const isLeft = absoluteX < width / 2;
    const isUp = translationY < -10;
    const isDown = translationY > 10;

    if (isUp || isDown) {
      if (isLeft) {
        SystemSetting.getBrightness().then(current => {
          const newVal = isUp ? Math.min(1, current + 0.05) : Math.max(0, current - 0.05);
          SystemSetting.setBrightness(newVal);
          setBrightness(newVal);
          showOverlayWithTimeout('brightness');
        });
      } else {
        SystemSetting.getVolume().then(current => {
          const newVal = isUp ? Math.min(1, current + 0.05) : Math.max(0, current - 0.05);
          SystemSetting.setVolume(newVal);
          setVolume(newVal);
          showOverlayWithTimeout('volume');
        });
      }
    }
  };

  const showOverlayWithTimeout = (type) => {
    setShowOverlay(type);
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    overlayTimeoutRef.current = setTimeout(() => setShowOverlay(null), 1000);
  };

  const filteredChannels = channelData.filter((channel) => {
    const matchSearch = channel.title.toLowerCase().includes(search.toLowerCase());
    const matchGroup = groupFilter === 'All' || channel.group === groupFilter;
    return matchSearch && matchGroup;
  });

  const renderCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedChannel(item)}>
      <Image source={{ uri: item.logo }} style={styles.logo} />
      {/* <Text style={styles.title}>{item.title}</Text> */}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111' }}>
<GestureHandlerRootView style={{flex:1}}>
      <View style={styles.container}>

        <Text style={styles.header}>TV Channels</Text>

        <TextInput
          placeholder="Search..."
          placeholderTextColor="#ccc"
          value={search}
          onChangeText={setSearch}
          style={styles.searchBar}
        />

        <View style={styles.filterContainer}>
          {['All', 'Music', 'News', 'Movies', 'Religious'].map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.filterBtn, groupFilter === g && styles.filterActive]}
              onPress={() => setGroupFilter(g)}
            >
              <Text style={styles.filterText}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredChannels}
          renderItem={renderCard}
          keyExtractor={(item) => item.title}
          numColumns={2}
          contentContainerStyle={styles.list}
        />

        <Modal visible={!!selectedChannel} onRequestClose={() => setSelectedChannel(null)}>
          <PanGestureHandler onGestureEvent={handleGesture}>
            <View style={styles.modalContainer}>
              {selectedChannel?.url?.startsWith('http') && (
                <Video
                  source={{ uri: selectedChannel.url }}
                  ref={videoRef}
                  style={StyleSheet.absoluteFillObject}
                  controls
                  resizeMode="contain"
                  repeat
                  onError={(e) => console.warn(e)}
                />
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedChannel(null)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>

              {showOverlay && (
                <View style={styles.overlayContainer}>
                  <View style={styles.overlayBox}>
                    <Text style={styles.overlayText}>
                      {showOverlay === 'brightness' ? '🔆 Brightness' : '🔊 Volume'}
                    </Text>
                    <View style={styles.overlayBarBackground}>
                      <View
                        style={{
                          height: '100%',
                          width: `${showOverlay === 'brightness' ? brightness : volume}00%`,
                          backgroundColor: '#0f0',
                        }}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </PanGestureHandler>
        </Modal>

      </View>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 10 },

  header: { fontSize: 22, color: '#fff', textAlign: 'center', marginBottom: 10 },

  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    height: 45,
    paddingHorizontal: 10
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#333',
    margin: 4,
    borderRadius: 10,
  },
  filterActive: { backgroundColor: 'green' },
  filterText: { color: '#fff' },
  list: { paddingHorizontal: 10 },
  card: {
    flex:1,
    backgroundColor: '#fff',
    margin: 8,
    height:100,
    borderRadius: 10,
    justifyContent:'center',
    alignItems: 'center',
    padding: 10,
  },
  logo: { width: 100, height: 60, resizeMode: 'contain', marginBottom: 5 },
  title: { color: '#fff', fontSize: 14, textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center' },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: '#00000088',
    borderRadius: 6,
  },
  closeText: { color: '#fff', fontSize: 16 },
  overlayContainer: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    right: '20%',
    alignItems: 'center',
  },
  overlayBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  overlayText: { color: 'white', fontSize: 16, marginBottom: 10 },
  overlayBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#444',
    borderRadius: 4,
    overflow: 'hidden',
  },
});