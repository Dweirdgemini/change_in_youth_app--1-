import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { trpc } from '@/lib/trpc';

// Agora imports - only for native platforms
let RtcEngine: any = null;
let ChannelProfileType: any = null;
let ClientRoleType: any = null;

if (Platform.OS !== 'web') {
  try {
    const AgoraModule = require('react-native-agora');
    RtcEngine = AgoraModule.default?.createAgoraRtcEngine;
    ChannelProfileType = AgoraModule.ChannelProfileType;
    ClientRoleType = AgoraModule.ClientRoleType;
  } catch (e) {
    console.warn('Agora SDK not available:', e);
  }
}

interface AgoraVideoCallProps {
  sessionId: number;
  channelName: string;
  userId: number;
  onCallEnd?: () => void;
}

export function AgoraVideoCall({ sessionId, channelName, userId, onCallEnd }: AgoraVideoCallProps) {
  const colors = useColors();
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [joinTime, setJoinTime] = useState<Date | null>(null);
  const engineRef = useRef<any>(null);

  const joinMutation = (trpc.videoCalls as any).joinCall.useMutation();
  const leaveMutation = (trpc.videoCalls as any).leaveCall.useMutation();

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web platform - show message
      return;
    }

    if (!RtcEngine) {
      console.error('Agora RTC Engine not available');
      return;
    }

    // Initialize Agora engine
    const initAgora = async () => {
      try {
        const engine = RtcEngine();
        engineRef.current = engine;

        // Initialize with App ID from environment
        await engine.initialize({
          appId: process.env.EXPO_PUBLIC_AGORA_APP_ID || '',
        });

        // Enable video
        await engine.enableVideo();

        // Set channel profile
        await engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);

        // Set client role
        await engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      } catch (error) {
        console.error('Failed to initialize Agora:', error);
      }
    };

    initAgora();

    return () => {
      // Cleanup
      if (engineRef.current) {
        engineRef.current.leaveChannel();
        engineRef.current.release();
      }
    };
  }, []);

  const handleJoinCall = async () => {
    if (Platform.OS === 'web') {
      alert('Video calling is only available on mobile devices. Please use the Expo Go app on iOS or Android.');
      return;
    }

    if (!engineRef.current) {
      alert('Video engine not initialized');
      return;
    }

    try {
      // Get token from server
      const tokenResponse = await fetch(`/api/video/token?channel=${channelName}&uid=${userId}`);
      const { token } = await tokenResponse.json();

      // Join channel
      await engineRef.current.joinChannel(token, channelName, userId, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });

      setIsJoined(true);
      const now = new Date();
      setJoinTime(now);

      // Record join in database
      await joinMutation.mutateAsync({
        sessionId,
        userId,
        joinedAt: now.toISOString(),
      });
    } catch (error) {
      console.error('Failed to join call:', error);
      alert('Failed to join video call');
    }
  };

  const handleLeaveCall = async () => {
    if (!engineRef.current || !joinTime) return;

    try {
      await engineRef.current.leaveChannel();
      setIsJoined(false);

      const leaveTime = new Date();
      const durationMinutes = Math.floor((leaveTime.getTime() - joinTime.getTime()) / 1000 / 60);

      // Record leave in database
      await leaveMutation.mutateAsync({
        sessionId,
        userId,
        leftAt: leaveTime.toISOString(),
        durationMinutes,
      });

      setJoinTime(null);
      onCallEnd?.();
    } catch (error) {
      console.error('Failed to leave call:', error);
    }
  };

  const toggleMute = async () => {
    if (!engineRef.current) return;
    await engineRef.current.muteLocalAudioStream(!isMuted);
    setIsMuted(!isMuted);
  };

  const toggleVideo = async () => {
    if (!engineRef.current) return;
    await engineRef.current.muteLocalVideoStream(!isVideoEnabled);
    setIsVideoEnabled(!isVideoEnabled);
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Video Calling Not Available on Web
        </Text>
        <Text style={[styles.message, { color: colors.muted }]}>
          Please use the Expo Go app on your iOS or Android device to join video calls.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {isJoined ? 'In Call' : 'Ready to Join'}
      </Text>

      {isJoined && joinTime && (
        <Text style={[styles.duration, { color: colors.muted }]}>
          Joined at {joinTime.toLocaleTimeString()}
        </Text>
      )}

      <View style={styles.controls}>
        {!isJoined ? (
          <Pressable
            onPress={handleJoinCall}
            style={({ pressed }) => [
              styles.button,
              styles.joinButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.buttonText}>Join Call</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={toggleMute}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: isMuted ? colors.error : colors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.buttonText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </Pressable>

            <Pressable
              onPress={toggleVideo}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: isVideoEnabled ? colors.primary : colors.error, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.buttonText}>{isVideoEnabled ? 'Video On' : 'Video Off'}</Text>
            </Pressable>

            <Pressable
              onPress={handleLeaveCall}
              style={({ pressed }) => [
                styles.button,
                styles.leaveButton,
                { backgroundColor: colors.error, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.buttonText}>Leave Call</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  duration: {
    fontSize: 14,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  joinButton: {
    minWidth: 200,
  },
  leaveButton: {
    minWidth: 200,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
