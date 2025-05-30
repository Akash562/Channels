import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, Modal, StyleSheet,
  Dimensions, TextInput, SafeAreaView, StatusBar,
  Animated, PanResponder,
  Platform
} from 'react-native';
import Video from 'react-native-video';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Orientation from 'react-native-orientation-locker';
import SQLite from 'react-native-sqlite-storage';
import LottieView from 'lottie-react-native';

import { channels } from './channels';

const db = SQLite.openDatabase({ name: 'tv.db', location: 'default' });

export default function App() {

  const channelData = channels;
  const [selectedChannel, setSelectedChannel] = useState(false);

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const videoRef = useRef(null);

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS favorites (title TEXT PRIMARY KEY);'
      );
    }, console.error, loadFavorites);
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      Orientation.lockToLandscape();
    } else {
      Orientation.lockToPortrait();
    }
  }, [selectedChannel]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const { dx, dy, moveX } = gesture;
        if (moveX < Dimensions.get('window').width / 2) {
          setBrightness(prev => Math.min(Math.max(prev + dy * -0.005, 0), 1));
        } else {
          setVolume(prev => Math.min(Math.max(prev + dy * -0.005, 0), 1));
        }
      }
    })
  ).current;

  const loadFavorites = () => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM favorites', [], (tx, results) => {
        const rows = results.rows.raw();
        const favTitles = rows.map(row => row.title);
        setFavorites(favTitles);
      });
    });
  };

  const toggleFavorite = (channel) => {
    const isFav = favorites.includes(channel.title);
    db.transaction(tx => {
      if (isFav) {
        tx.executeSql('DELETE FROM favorites WHERE title = ?', [channel.title]);
      } else {
        tx.executeSql('INSERT INTO favorites (title) VALUES (?)', [channel.title]);
      }
    }, console.error, loadFavorites);
  };

  const filteredChannels = channelData.filter(channel => {
    const matchSearch = channel.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchGroup = groupFilter === 'All' || channel.group === groupFilter;
    return matchSearch && matchGroup;
  });

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelectedChannel(item)}>
      <TouchableOpacity onPress={() => toggleFavorite(item)} style={{ width: '100%', justifyContent: 'center', alignItems: 'flex-end' }}>
        <Text style={styles.heart}>{favorites.includes(item.title) ? '❤️' : '🤍'}</Text>
      </TouchableOpacity>
      <Image source={{ uri: item.logo }} style={styles.logo} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111', paddingTop: Platform.OS == 'ios' ? 0 : 50 }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          <StatusBar hidden={!!selectedChannel} />
          <Text style={styles.header}>Streaming Channels</Text>

          <TextInput
            placeholder="Search..."
            placeholderTextColor="#1c1c1c"
            value={search}
            onChangeText={setSearch}
            style={styles.searchBar}
          />

          <View style={styles.filterContainer}>
            {['All', 'Music', 'News', 'Movies', 'Religious'].map(g => (
              <TouchableOpacity key={g} style={[styles.filterBtn, groupFilter === g && styles.filterActive]}
                onPress={() => setGroupFilter(g)}>
                <Text style={styles.filterText}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {favorites.length > 0 && (
            <View style={{ marginVertical: 10 }}>
              <Text style={styles.favHeading}>⭐ Favorites</Text>
              <FlatList
                data={channelData.filter(c => favorites.includes(c.title))}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.title}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.favCard}
                    onPress={() => {
                      setSelectedChannel(item);
                    }}>
                    <Image source={{ uri: item.logo }} style={styles.favLogo} />
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          <FlatList
            data={filteredChannels}
            renderItem={renderCard}
            keyExtractor={item => item.title}
            numColumns={2}
            contentContainerStyle={styles.list}
          />

          <Modal
            visible={!!selectedChannel}
            onOrientationChange={() => Orientation.lockToLandscape()}>
            <View style={styles.modalContainer}>
              {selectedChannel?.url?.startsWith('http') && (
                <Animated.View
                  {...panResponder.panHandlers}
                  style={[styles.videoContainer]}>

                  {loading && (
                    <LottieView
                      source={require('./src/assets/loading.json')}
                      autoPlay
                      loop
                      style={styles.loader}
                    />
                  )}
                  <Video
                    ref={videoRef}
                    source={{ uri: selectedChannel.url }}
                    style={StyleSheet.absoluteFillObject}
                    controls
                    resizeMode="contain"
                    repeat
                    volume={10}
                    onLoadStart={() => setLoading(true)}
                    onLoad={() => setLoading(false)}
                    onError={() => setSelectedChannel(false)}
                  />
                </Animated.View>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedChannel(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>

            </View>
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
    paddingHorizontal: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
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
  card: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 8,
    height: 100,
    borderRadius: 10,
    justifyContent: 'center',
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

  favHeading: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    marginBottom: 5
  },
  favCard: {
    width: 120,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 5,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  favLogo: {
    width: 80,
    height: 50,
    resizeMode: 'contain'
  },
  favTitle: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5
  },

  videoContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  video: {
    width: '100%',
    height: '100%'
  },
  loader: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    position: 'absolute',
    top: '40%'
  },
});
