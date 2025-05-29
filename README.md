# 📺 React Native Live TV Streaming App

This is a React Native application that streams live TV channels with support for volume and brightness gestures, full-screen landscape video playback, and categorized filtering.

---

## 🚀 Features

* 🔍 **Search & Filter Channels**
  Quickly find channels by name or category (Music, News, Movies, Religious, etc.).

* 🎥 **Live Video Streaming**
  Streams live video from channel URLs.

* 📱 **Full-Screen Landscape Video Mode**
  Automatically switches to landscape when playing a video.

* 🌕 **Volume & Brightness Control**
  Vertical swipe gestures on the left and right of the screen control brightness and volume, respectively.

* ❌ **Exit Video Easily**
  Close the video modal with a single tap.

---

## 📲 Installation

1. Clone the repo:

   ```bash
   git clone https://github.com/yourusername/live-tv-streaming-app.git
   cd live-tv-streaming-app
   ```

2. Install dependencies:

   ```bash
   npm install
   npx pod-install    # iOS only
   ```

3. Run on Android or iOS:

   ```bash
   npx react-native run-android
   # or
   npx react-native run-ios
   ```

---

## ✍️ Customizing Channels

Update the `channels.js` file to add or modify the list of available channels:

```js
export const channels = [
  {
    title: 'Music Channel',
    url: 'http://example.com/stream1.m3u8',
    logo: 'http://example.com/logo1.png',
    group: 'Music',
  },
  ...
];
```

---

## 🚲 Future Enhancements (Suggestions)

* Chromecast or AirPlay support
* Background audio playback
* User favorites & persistent storage
* Program guide (EPG)

---

## 📄 License

This project is open source.

---

## 🙇‍♂️ Contact

For issues or contributions, feel free to open an [Issue](https://github.com/Akash562) or submit a PR.
