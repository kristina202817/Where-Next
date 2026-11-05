type Props = { on: boolean; onClick?: () => void; label: string };

// Heart — State = Off / On (Figma component)
export default function Heart({ on, onClick, label }: Props) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`flex size-[44px] items-center justify-center rounded-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-transform active:scale-90 ${
        on ? "bg-paper" : "bg-[rgba(246,242,233,0.85)]"
      }`}
    >
      <img src={on ? "/assets/0c6c2.svg" : "/assets/95633.svg"} alt="" className="block size-[24px]" />
    </button>
  );
}
