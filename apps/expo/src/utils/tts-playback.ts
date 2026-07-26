import { createAudioPlayer } from "expo-audio";
import { File, Paths } from "expo-file-system";

/**
 * Writes base64 mp3 bytes (from `onboarding.speak`) to a cache file and
 * plays it, resolving when playback ends (or errors/times out). Mirrors
 * the web voice-phase's `playTTS` — audio is decoration, so failures never
 * throw, they just resolve early.
 */
export function playTtsAudio(
  base64: string,
  hardCapMs = 25_000,
): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    const capId = setTimeout(finish, hardCapMs);

    try {
      const file = new File(Paths.cache, `tts-${Date.now()}.mp3`);
      file.create();
      file.write(base64, { encoding: "base64" });

      const player = createAudioPlayer({ uri: file.uri });
      const subscription = player.addListener(
        "playbackStatusUpdate",
        (status) => {
          if (status.didJustFinish) {
            clearTimeout(capId);
            subscription.remove();
            player.remove();
            try {
              file.delete();
            } catch {
              /* best-effort cleanup */
            }
            finish();
          }
        },
      );
      player.play();
    } catch {
      clearTimeout(capId);
      finish();
    }
  });
}
