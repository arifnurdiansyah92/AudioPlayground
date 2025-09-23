import { Feather } from "@expo/vector-icons";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import React, { useEffect, useState } from "react";
import { Alert, Button, Pressable, StyleSheet, Text, View } from "react-native";

const AudioScreen: React.FC = () => {
  // --- URL playback (expo-audio player) ---
  const sampleAudioUrl =
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
  const urlPlayer = useAudioPlayer(sampleAudioUrl);
  const urlStatus = useAudioPlayerStatus(urlPlayer); // { playing, paused, duration, currentTime, ... }

  // --- Recorder (expo-audio recorder) ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder); // { isRecording, uri, currentTime, ... }

  // --- Local state for recorded URI ---
  const [recordedUri, setRecordedUri] = useState<string | null>(null);

  // Player for recorded audio (loads when recordedUri available)
  const recordedPlayer = useAudioPlayer(recordedUri ?? null);
  const recordedStatus = useAudioPlayerStatus(recordedPlayer);

  // Permissions + audio mode
  useEffect(() => {
    (async () => {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Permission needed",
          "Microphone permission is required to record audio."
        );
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  // --- Handlers ---
  const togglePlayUrl = async () => {
    if (urlStatus.playing) {
      urlPlayer.pause();
    } else {
      urlPlayer.play();
    }
  };

  const startRecording = async () => {
    try {
      await recorder.prepareToRecordAsync();
      recorder.record(); // start
    } catch (e) {
      console.error("Failed to start recording", e);
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop(); // after stop, uri available on recorder.uri
      if (recorder.uri) {
        setRecordedUri(recorder.uri);
      }
    } catch (e) {
      console.error("Failed to stop recording", e);
    }
  };

  const togglePlayRecorded = async () => {
    if (!recordedUri) return;
    if (recordedStatus.playing) {
      recordedPlayer.pause();
    } else {
      // ensure we replay from the start if it already finished
      if (
        recordedPlayer.paused &&
        recordedStatus.currentTime >= recordedStatus.duration
      ) {
        await recordedPlayer.seekTo(0);
      }
      recordedPlayer.play();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Audio Playground</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Play from Internet</Text>
        <Button
          title={urlStatus.playing ? "Pause Sound" : "Play Sample Sound"}
          onPress={togglePlayUrl}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Record Your Voice</Text>
        <Pressable
          style={[
            styles.micButton,
            recState.isRecording ? styles.micButtonRecording : null,
          ]}
          onPress={recState.isRecording ? stopRecording : startRecording}
        >
          <Feather name="mic" size={32} color="white" />
        </Pressable>
        <Text style={styles.statusText}>
          {recState.isRecording ? "Recording..." : "Tap mic to record"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Play Your Recording</Text>
        <Button
          title={recordedStatus.playing ? "Pause Recording" : "Play Recording"}
          onPress={togglePlayRecorded}
          disabled={!recordedUri}
        />
        {recordedUri && (
          <Text style={styles.uriText} selectable>
            Recording is ready to play.
          </Text>
        )}
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f8",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#333",
  },
  section: {
    width: "100%",
    marginBottom: 40,
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
    color: "#555",
  },
  micButton: {
    backgroundColor: "#3498db",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  micButtonRecording: {
    backgroundColor: "#e74c3c",
  },
  statusText: {
    fontSize: 16,
    color: "#666",
  },
  uriText: {
    fontSize: 14,
    color: "#888",
    marginTop: 10,
    textAlign: "center",
  },
});

export default AudioScreen;
