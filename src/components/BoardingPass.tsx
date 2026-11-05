import { gateOf, seatOf, type City } from "../data/cities";

// Boarding Pass (Figma component "Boarding Pass — Porto"), 960 × 400
export default function BoardingPass({ city }: { city: City }) {
  const gate = gateOf(city);
  const seat = seatOf(city);
  const fields: [string, string][] = [
    ["GATE", gate],
    ["SEAT", seat],
    ["BOARDING", "NOW"],
    ["DEPARTS", "WHEN YOU’RE READY"],
  ];
  return (
    <div className="relative h-[400px] w-[960px] text-ink">
      <div className="absolute left-0 top-0 h-[400px] w-[960px]">
        <div className="absolute inset-[-5%_-3.33%_-11%_-3.33%]">
          <img alt="" className="block size-full max-w-none" src="/assets/b83e2.svg" />
        </div>
      </div>
      <div className="absolute left-[720px] top-[30px] flex h-[340px] w-0 items-center justify-center">
        <div className="flex-none rotate-90">
          <div className="relative h-0 w-[340px]">
            <div className="absolute inset-[-1.5px_0_0_0]">
              <img alt="" className="block size-full max-w-none" src="/assets/cebb2.svg" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-0 top-0 flex h-[400px] w-[720px] flex-col items-start justify-between overflow-clip px-[44px] py-[36px]">
        <div className="flex w-full justify-between whitespace-nowrap font-inter text-[13px] font-medium tracking-[1.95px]">
          <p>BOARDING PASS</p>
          <p className="text-ultramarine">WHERE NEXT? AIRLINES</p>
        </div>
        <div className="flex items-center gap-[36px] whitespace-nowrap">
          <div className="flex flex-col">
            <p className="font-inter text-[12px] font-medium tracking-[1.44px] text-[rgba(27,26,24,0.55)]">FROM</p>
            <p className="font-bebas text-[88px] leading-[1.2]">HERE</p>
          </div>
          <div className="relative size-[36px] shrink-0 overflow-clip">
            <div className="absolute inset-[8.33%_8.33%_12.5%_8.33%] flex items-center justify-center [container-type:size]">
              <div className="h-[100cqw] w-[100cqh] flex-none rotate-90">
                <img alt="" className="block size-full max-w-none" src="/assets/c5543.svg" />
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <p className="font-inter text-[12px] font-medium tracking-[1.44px] text-[rgba(27,26,24,0.55)]">TO</p>
            <p className="font-bebas text-[88px] leading-[1.2] text-ultramarine">{city.name.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex gap-[44px] whitespace-nowrap font-inter font-medium">
          {fields.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-[4px]">
              <p className="text-[11px] tracking-[1.32px] text-[rgba(27,26,24,0.55)]">{label}</p>
              <p className="text-[18px]">{value}</p>
            </div>
          ))}
        </div>
        <p className="w-[632px] font-caveat text-[22px] text-ultramarine">
          <span className="font-bold">Why:</span> {city.why}
        </p>
      </div>

      <div className="absolute left-[720px] top-0 flex h-[400px] w-[240px] flex-col items-start gap-[10px] overflow-clip px-[28px] py-[32px]">
        <img alt="" src={city.photo} className="h-[150px] w-[184px] shrink-0 rounded-[12px] object-cover" />
        <p className="whitespace-nowrap font-bebas text-[40px] leading-[1.2]">{city.name.toUpperCase()}</p>
        <p className="whitespace-nowrap font-inter text-[12px] font-medium tracking-[1.2px] text-[rgba(27,26,24,0.6)]">
          GATE {gate} · SEAT {seat}
        </p>
        <p className="whitespace-nowrap font-barcode text-[58px] leading-[1.2]" aria-label={`Barcode WN${gate}${seat}`}>
          {`WN${gate}${seat}`}
        </p>
      </div>
    </div>
  );
}
