import { useEffect } from "react";
import type { City } from "../data/cities";
import { playBoarding, stopBoarding, useAnnouncementSpeaking } from "../audio/sound";
import BoardingPass from "../components/BoardingPass";
import { Screen } from "../components/Stage";

type Props = {
  city: City;
  playAnnouncement: boolean;
  onStartOver: () => void;
  onSeeAll: () => void;
  announce: (msg: string) => void;
};

export default function BoardingScreen({ city, playAnnouncement, onStartOver, onSeeAll, announce }: Props) {
  useEffect(() => {
    announce(`Now boarding. Passengers travelling to ${city.name}, your flight is now boarding`);
    if (playAnnouncement) void playBoarding(city.name);
    return stopBoarding;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city.id]);
  const speaking = useAnnouncementSpeaking();

  const background = (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-[#212b54] via-[#121429] via-60% to-[#08080d]" />
      <div className="absolute inset-0 bg-[rgba(27,26,24,0.3)]" />
      <img src="/assets/opt/41065.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-20" />
    </>
  );

  return (
    <Screen background={background}>
      <div className="absolute left-1/2 top-[110px] flex -translate-x-1/2 flex-col items-center gap-[6px] whitespace-nowrap text-paper">
        <p className="font-inter text-[13px] font-medium tracking-[1.95px] text-[rgba(246,242,233,0.7)]">NOW BOARDING</p>
        <h2 className="font-bebas text-[56px] leading-[1.2]">YOUR NEXT TRIP IS READY</h2>
      </div>

      <div className="anim-slide-in absolute left-[240px] top-[250px]">
        <BoardingPass city={city} />
      </div>

      {speaking && (
        <div className="glass absolute left-1/2 top-[690px] flex -translate-x-1/2 items-center gap-[8px] whitespace-nowrap rounded-full px-[16px] py-[10px]">
          <img src="/assets/452dc.svg" alt="" className="size-[16px]" />
          <p className="font-inter text-[13px] text-[rgba(246,242,233,0.85)]">“Passengers travelling to {city.name}, your flight is now boarding”</p>
        </div>
      )}

      <div className="absolute left-1/2 top-[760px] flex -translate-x-1/2 gap-[12px]">
        <button type="button" autoFocus onClick={onStartOver} className="rounded-[14px] bg-ultramarine px-[28px] py-[16px] font-inter text-[16px] font-medium text-paper transition-transform active:scale-[0.98]">
          Start over
        </button>
        <button type="button" onClick={onSeeAll} className="glass rounded-[14px] px-[28px] py-[16px] font-inter text-[16px] font-medium text-paper transition-transform active:scale-[0.98]">
          See all picks
        </button>
      </div>
    </Screen>
  );
}
