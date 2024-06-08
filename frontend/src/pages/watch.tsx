import * as AspectRatio from "@radix-ui/react-aspect-ratio";
import cn from "classnames";
import { Howler, Howl } from "howler";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";

import LanguageToggle from "./Carousel/LanguageToggle/LanguageToggle";
import styles from "./Carousel.module.scss";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { getAudioUrl, getProject, getStreamUrl } from "@/services/dubbing";
import { getLanguageMap } from "./Carousel/languageMap";
const Waveform = lazy(() => import("./Carousel/Waveform/Waveform"));

function PlayCircle({ size = "1rem", color = "currentColor", ...otherProps }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0ZM9.38154 7.763C9.27273 7.90834 9.27273 8.16868 9.27273 8.68935V15.3104C9.27273 15.8311 9.27273 16.0915 9.38154 16.2368C9.47636 16.3635 9.62151 16.4427 9.77932 16.454C9.96042 16.4669 10.1794 16.3261 10.6174 16.0446L15.7671 12.734C16.1472 12.4897 16.3372 12.3675 16.4028 12.2122C16.4602 12.0765 16.4602 11.9233 16.4028 11.7876C16.3372 11.6323 16.1472 11.5101 15.7671 11.2658L10.6174 7.95523C10.1794 7.67367 9.96042 7.53289 9.77932 7.54583C9.62151 7.5571 9.47636 7.63634 9.38154 7.763Z"
        fill={color}
      />
    </svg>
  );
}

type AudioTrack = {
  language: string;
  sample: Howl;
};

type Config = {
  id: string;
  video: string;
  audioTracks: AudioTrack[];
  index: number;
};

const DEFAULT_WAVEFORM_COLORS = ["#C369F8", "#ffffff"];

export default function Watch() {
  const [audioTrackIndex, setAudioTrackIndex] = useState(0);
  const [data, setData] = useState<Config>();
  const [isPlaying, setIsPlaying] = useState(false);

  const params = useParams<{ id: string }>();

  const { data: projectData } = useQuery({
    queryKey: ["projects", params.id],
    queryFn: () => getProject(params.id!),
  });

  useEffect(() => {
    if (projectData && projectData.status === "dubbed") {
      setData({
        id: "demovideo",
        video: getStreamUrl(projectData.id),
        audioTracks: [
          {
            language: "en",
            sample: new Howl({
              src: [getAudioUrl(projectData.id, "raw")],
              preload: true,
            }),
          },
          ...projectData.target_languages.map(language => ({
            language,
            sample: new Howl({
              src: [getAudioUrl(projectData.id, language)],
              preload: true,
            }),
          })),
        ],
        index: 0,
      });
    }
  }, [projectData]);

  const playVideo = (sample: Howl) => {
    const activeVideo = document.getElementById(`video`) as HTMLVideoElement;
    const playing = activeVideo.play();
    playing.then(() => {
      sample.play();
      setIsPlaying(true);
    });
  };

  function resetMedia() {
    Howler.stop();
    const video = document.getElementById("video") as HTMLVideoElement;
    video.pause();
    video.load();
    setAudioTrackIndex(0);
    setIsPlaying(false);
  }

  function toggleAudio(audioIndex: number, sample: Howl) {
    setAudioTrackIndex(audioIndex);
    if (!isPlaying) return;
    const activeVideo = document.getElementById(`video`) as HTMLVideoElement;
    const elapsedTime = activeVideo.currentTime;
    Howler.stop();
    sample.seek(elapsedTime);
    sample.play();
  }

  const currentLanguage = useMemo(() => {
    if (!data) return;
    return data?.audioTracks[audioTrackIndex].language;
  }, [audioTrackIndex, data]);

  useEffect(() => {
    if (!data) return;
    const track1 = data?.audioTracks[0].sample;
    const track2 = data?.audioTracks[1].sample;
    const activeVideo = document.getElementById(`video`) as HTMLVideoElement;
    track1?.load();
    track2?.load();
    activeVideo?.load();
  }, [data]);

  return (
    <div className="relative h-screen flex items-center justify-center">
      <div className={styles.wave}>
        {/* <Suspense fallback={null}>
          <Waveform
            colors={
              !isPlaying
                ? DEFAULT_WAVEFORM_COLORS
                : getLanguageMap(currentLanguage || "en").colors
            }
          />
        </Suspense> */}
      </div>
      {projectData && projectData.status === "dubbing" && (
        <div className="z-40">
          <p
            className="text-center font-semibold text-2xl"
            style={{ color: "black" }}
          >
            Video still processing. Please wait.
          </p>
        </div>
      )}

      <div className="content">
        {!data && (
          <div className="max-w-screen-2xl w-full mx-auto flex justify-center items-center">
            <div className="w-64 h-36 border-2 border-gray-200 flex items-center justify-center">
              <p className="text-lg font-semibold">Loading...</p>
            </div>
          </div>
        )}
        {data && (
          <div className="max-w-screen-2xl w-full mx-auto flex justify-center">
            <div className={styles.videoContainer}>
              {/* <AspectRatio.Root ratio={16 / 9}>
                <video
                  id={`video`}
                  src={data.video}
                  className={styles.video}
                  muted
                  playsInline
                />
              </AspectRatio.Root>
              {!isPlaying && ( */}
                <button
                  className={styles.playButton}
                  onClick={() =>
                    playVideo(data.audioTracks[audioTrackIndex].sample)
                  }
                >
                  <PlayCircle size={64} className={styles.playCircle} />
                </button>
              <div className={styles.overlay} data-active={true} />
              <div className={styles.toggle}>
                <LanguageToggle
                  languages={data.audioTracks.map(({ language }) => language)}
                  value={audioTrackIndex}
                  onChange={audioIndex =>
                    toggleAudio(
                      audioIndex,
                      data.audioTracks[audioIndex].sample
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}