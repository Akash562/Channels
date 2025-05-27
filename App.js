import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  ScrollView,
  TextInput,
} from 'react-native';
import Video from 'react-native-video';
import RNPickerSelect from 'react-native-picker-select';

import { channels } from './channels';

const { width, height } = Dimensions.get('window');


const groupedChannels = channels.reduce((groups, channel) => {
  const group = channel.group || 'Others';
  if (!groups[group]) groups[group] = [];
  groups[group].push(channel);
  return groups;
}, {});

const allGroups = ['All', ...Object.keys(groupedChannels)];

export default function App() {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [videoErrorCount, setVideoErrorCount] = useState(0);
  const videoRef = useRef(null);

  const getFilteredChannels = () => {
    let filtered = channels;
    if (selectedGroup !== 'All') {
      filtered = filtered.filter((ch) => ch.group === selectedGroup);
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter((ch) =>
        ch.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const retryPlayback = () => {
    if (videoErrorCount < 3 && selectedChannel) {
      setTimeout(() => {
        setVideoErrorCount((prev) => prev + 1);
        setSelectedChannel({ ...selectedChannel });
      }, 3000); // retry after 3 seconds
    }
  };

  const renderChannelCard = (channel) => (
    <TouchableOpacity
      key={channel.title}
      style={styles.card}
      onPress={() => {
        setVideoErrorCount(0);
        setSelectedChannel(channel);
      }}
    >
      <Image source={{ uri: channel.logo }} style={styles.logo} />
      <Text style={styles.title}>{channel.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📺 Live TV Channels</Text>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search Channels..."
        placeholderTextColor="#aaa"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Filter */}
      <RNPickerSelect
        onValueChange={(value) => setSelectedGroup(value)}
        items={allGroups.map((g) => ({ label: g, value: g }))}
        value={selectedGroup}
        placeholder={{}}
        style={pickerSelectStyles}
      />

      {/* Channel Cards */}
      <ScrollView>
        <FlatList
          data={getFilteredChannels()}
          numColumns={2}
          renderItem={({ item }) => renderChannelCard(item)}
          keyExtractor={(item) => item.title}
          scrollEnabled={false}
        />
      </ScrollView>

      {/* Modal Video Player */}
      <Modal
        visible={!!selectedChannel}
        animationType="fade"
        onRequestClose={() => setSelectedChannel(null)}
        hardwareAccelerated
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          {selectedChannel?.url?.startsWith('http') ? (
            <Video
              source={{ uri: selectedChannel.url }}
              ref={videoRef}
              style={styles.video}
              controls
              resizeMode="cover"
              fullscreen
              onError={(err) => {
                console.warn('Video error', err);
                retryPlayback();
              }}
            />
          ) : (
            <Text style={styles.errorText}>Cannot play this stream</Text>
          )}
          <TouchableOpacity
            onPress={() => setSelectedChannel(null)}
            style={styles.closeBtn}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
}

// Styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
    paddingTop: 40,
    paddingHorizontal: 12,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#1f1f1f',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  card: {
    width: (width - 48) / 2,
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    margin: 6,
    padding: 10,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  video: {
    width: width,
    height: height,
  },
  closeBtn: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#ff0044',
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    color: '#fff',
    padding: 10,
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    marginBottom: 12,
  },
  inputAndroid: {
    color: '#fff',
    padding: 10,
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    marginBottom: 12,
  },
};