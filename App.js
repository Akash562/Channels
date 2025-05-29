import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Modal, StyleSheet, Dimensions, TextInput, SafeAreaView } from 'react-native';
import Video from 'react-native-video';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
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
      <Text style={styles.title}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111' }}>

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
  filterActive: { backgroundColor: '#00f' },
  filterText: { color: '#fff' },
  list: { paddingHorizontal: 10 },
  card: {
    backgroundColor: '#222',
    margin: 8,
    flex: 1,
    borderRadius: 10,
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


// ---------------old --------------------------------------------------------------------------------------------------------------
// import React, { useState, useEffect, useRef } from 'react';
// import { View, Text, FlatList, Image, TouchableOpacity, Modal, StyleSheet, Dimensions, ScrollView, TextInput, SafeAreaView } from 'react-native';
// import Video from 'react-native-video';
// import RNPickerSelect from 'react-native-picker-select';

// import { PanGestureHandler, State } from 'react-native-gesture-handler';
// import SystemSetting from 'react-native-system-setting';

// import { channels } from './channels';

// const { width, height } = Dimensions.get('window');


// const groupedChannels = channels.reduce((groups, channel) => {
//   const group = channel.group || 'Others';
//   if (!groups[group]) groups[group] = [];
//   groups[group].push(channel);
//   return groups;
// }, {});

// const allGroups = ['All', ...Object.keys(groupedChannels)];
// const handleGesture = ({ nativeEvent }) => {
//   const { translationY, translationX, absoluteX, state } = nativeEvent;

//   if (state !== State.ACTIVE) return;

//   const isLeft = absoluteX < width / 2;
//   const isUp = translationY < -10;
//   const isDown = translationY > 10;

//   if (isUp || isDown) {
//     if (isLeft) {
//       SystemSetting.getBrightness().then((brightness) => {
//         const newBrightness = isUp
//           ? Math.min(1, brightness + 0.05)
//           : Math.max(0, brightness - 0.05);
//         SystemSetting.setBrightness(newBrightness);
//       });
//     } else {
//       SystemSetting.getVolume().then((volume) => {
//         const newVolume = isUp
//           ? Math.min(1, volume + 0.05)
//           : Math.max(0, volume - 0.05);
//         SystemSetting.setVolume(newVolume);
//       });
//     }
//   }
// };

// export default function App() {

//   const [selectedChannel, setSelectedChannel] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedGroup, setSelectedGroup] = useState('All');
//   const [videoErrorCount, setVideoErrorCount] = useState(0);
//   const videoRef = useRef(null);

//   const getFilteredChannels = () => {
//     let filtered = channels;
//     if (selectedGroup !== 'All') {
//       filtered = filtered.filter((ch) => ch.group === selectedGroup);
//     }
//     if (searchQuery.trim()) {
//       filtered = filtered.filter((ch) =>
//         ch.title.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }
//     return filtered;
//   };

//   const retryPlayback = () => {
//     if (videoErrorCount < 3 && selectedChannel) {
//       setTimeout(() => {
//         setVideoErrorCount((prev) => prev + 1);
//         setSelectedChannel({ ...selectedChannel });
//       }, 3000); // retry after 3 seconds
//     }
//   };

//   const renderChannelCard = (channel) => (
//     <TouchableOpacity
//       key={channel.title}
//       style={styles.card}
//       onPress={() => {
//         setVideoErrorCount(0);
//         setSelectedChannel(channel);
//       }}
//     >
//       <Image source={{ uri: channel.logo }} style={styles.logo} />
//       <Text style={styles.title}>{channel.title}</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: '#101010' }}>
//       <View style={styles.container}>

//         <Text style={styles.header}>📺 Live TV Channels</Text>

//         {/* Search */}
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search Channels..."
//           placeholderTextColor="#aaa"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//         />

//         {/* Filter */}
//         <RNPickerSelect
//           onValueChange={(value) => setSelectedGroup(value)}
//           items={allGroups.map((g) => ({ label: g, value: g }))}
//           value={selectedGroup}
//           placeholder={{ color: '#aaa' }}
//           style={pickerSelectStyles}
//         />

//         {/* Channel Cards */}
//         <ScrollView>
//           <FlatList
//             data={getFilteredChannels()}
//             numColumns={2}
//             renderItem={({ item }) => renderChannelCard(item)}
//             keyExtractor={(item) => item.title}
//             scrollEnabled={false}
//           />
//         </ScrollView>

//         {/* Modal Video Player */}
//         <Modal
//           visible={!!selectedChannel}
//           animationType="fade"
//           onRequestClose={() => setSelectedChannel(null)}
//           hardwareAccelerated
//           statusBarTranslucent
//         >
//           <PanGestureHandler onGestureEvent={handleGesture}>
//           <View style={styles.modalContainer}>
//             {selectedChannel?.url?.startsWith('http') ? (
//               <Video
//                 source={{ uri: selectedChannel.url }}
//                 ref={videoRef}
//                 style={styles.video}
//                 controls
//                 resizeMode="cover"
//                 fullscreen
//                 onError={(err) => {
//                   console.warn('Video error', err);
//                   retryPlayback();
//                 }}
//               />
//             ) : (
//               <Text style={styles.errorText}>Cannot play this stream</Text>
//             )}
//             <TouchableOpacity
//               onPress={() => setSelectedChannel(null)}
//               style={styles.closeBtn}
//             >
//               <Text style={styles.closeText}>Close</Text>
//             </TouchableOpacity>
//           </View>
//           </PanGestureHandler>
//         </Modal>

//       </View>
//     </SafeAreaView>
//   );
// }

// // Styling
// const styles = StyleSheet.create({
//   container: {
//     paddingTop: 10,
//     paddingHorizontal: 12,
//   },
//   header: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 12,
//   },
//   searchInput: {
//     backgroundColor: '#fff',
//     color: '#fff',
//     borderRadius: 8,
//     padding: 10,
//     marginBottom: 10,
//   },
//   card: {
//     width: (width - 48) / 2,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     margin: 6,
//     padding: 10,
//     alignItems: 'center',
//   },
//   logo: {
//     width: 80,
//     height: 80,
//     resizeMode: 'contain',
//     marginBottom: 6,
//   },
//   title: {
//     fontSize: 12,
//     color: '#fff',
//     textAlign: 'center',
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: 'black',
//     justifyContent: 'center',
//   },
//   video: {
//     width: width,
//     height: height,
//   },
//   closeBtn: {
//     position: 'absolute',
//     bottom: 30,
//     left: 20,
//     right: 20,
//     backgroundColor: '#ff0044',
//     padding: 15,
//     alignItems: 'center',
//     borderRadius: 10,
//   },
//   closeText: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
//   errorText: {
//     color: '#fff',
//     textAlign: 'center',
//     marginTop: 100,
//   },
// });

// const pickerSelectStyles = {
//   inputIOS: {
//     color: '#aaa',
//     padding: 10,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     marginBottom: 12,
//   },
//   inputAndroid: {
//     color: '#aaa',
//     padding: 10,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     marginBottom: 12,
//   },
// };