import type { City } from "../data/cities";
import Heart from "./Heart";

type FrontProps = {
  city: City;
  heart?: "hidden" | "off" | "on";
  onHeart?: () => void;
};

// CityCard — Side = Front. Natural size 458 × 714; parents scale it.
export function CityCardFront({ city, heart = "hidden", onHeart }: FrontProps) {
  return (
    <div className="relative flex h-[714px] w-[458px] flex-col gap-[32px] rounded-[36px] bg-paper p-[24px] text-ink">
      <img src={city.photo} alt={`${city.name}, ${city.country}`} className="h-[510px] w-full shrink-0 rounded-[20px] object-cover" draggable={false} />
      <div className="flex flex-col gap-[20px]">
        <div className="flex h-[59px] items-start justify-between">
          <div className="flex flex-col gap-[6px] leading-none">
            <p className="font-bebas text-[40px] leading-[0.9]">{city.name}</p>
            <p className="font-bebas text-[18px] leading-none">{city.country}</p>
          </div>
          {/* ~1.4× the frame's 12px / p-8 / r-16 */}
          <span className="whitespace-nowrap rounded-[22px] bg-ultramarine px-[11px] py-[11px] font-inter text-[17px] leading-none text-paper">{city.budget}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <p className="font-inter text-[14px] text-ultramarine">{city.seasons}</p>
          <p className="whitespace-nowrap font-caveat text-[22px] leading-none">{city.note}</p>
        </div>
      </div>
      {heart !== "hidden" && (
        <div className="absolute right-[40px] top-[40px]">
          <Heart on={heart === "on"} onClick={onHeart} label={`${heart === "on" ? "Unselect" : "Select"} ${city.name}`} />
        </div>
      )}
    </div>
  );
}

// CityCard — Side = Back
export function CityCardBack({ city, heart = "hidden", onHeart }: FrontProps) {
  const Fact = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-[2px]">
      <p className="font-inter text-[12px]">{label}</p>
      <p className="font-inter text-[16px] font-medium">{value}</p>
    </div>
  );
  return (
    <div className="relative flex h-[714px] w-[458px] flex-col gap-[12px] rounded-[36px] bg-paper p-[24px] text-ink">
      <div className="flex flex-col gap-[22px]">
        <div className="flex items-end justify-between border-b border-ink pb-[4px]">
          <p className="font-bebas text-[54px] leading-[0.9]">{city.name}</p>
          <p className="font-inter text-[12px]">{city.coords}</p>
        </div>
        <img src={city.photo} alt="" className="h-[258px] w-full rounded-[20px] object-cover" draggable={false} />
      </div>
      <div className="flex flex-col gap-[24px]">
        <div className="flex flex-col gap-[20px]">
          <div className="flex justify-between border-b border-[rgba(27,26,24,0.5)] pb-[6px]">
            <Fact label="Language" value={city.language} />
            <Fact label="Currency" value={city.currency} />
            <Fact label="Ideal stay" value={city.idealStay} />
          </div>
          <div className="flex flex-col gap-[20px] border-b border-[rgba(27,26,24,0.5)] pb-[6px]">
            <Fact label="Best season" value={city.bestSeason} />
            <Fact label="Temperature" value={city.temperature} />
          </div>
        </div>
        <div className="flex justify-between">
          {city.tags.map((t) => (
            <span key={t} className="flex h-[35px] items-center rounded-[16px] border border-ultramarine px-[18px] font-bebas text-[20px] uppercase">
              {t}
            </span>
          ))}
        </div>
        <p className="font-caveat text-[22px] leading-[1.1] text-ultramarine">
          <span className="font-bold">Why: </span>
          {city.why}
        </p>
      </div>
      {heart !== "hidden" && (
        <div className="absolute right-[40px] top-[40px]">
          <Heart on={heart === "on"} onClick={onHeart} label={`${heart === "on" ? "Unselect" : "Select"} ${city.name}`} />
        </div>
      )}
    </div>
  );
}
