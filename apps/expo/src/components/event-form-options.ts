export const GENRES = [
  { value: "solo_recital", label: "Solo Recital" },
  { value: "chamber", label: "Chamber Music" },
  { value: "orchestral", label: "Orchestral" },
  { value: "opera", label: "Opera" },
  { value: "choral", label: "Choral" },
  { value: "ballet", label: "Ballet" },
  { value: "jazz", label: "Jazz" },
] as const;

export const DIFFICULTIES = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

export type Genre = (typeof GENRES)[number]["value"];
export type Difficulty = (typeof DIFFICULTIES)[number]["value"];

export const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const totalMinutes = i * 15;
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = String(totalMinutes % 60).padStart(2, "0");
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return {
    value: `${String(hour24).padStart(2, "0")}:${minute}`,
    label: `${hour12}:${minute} ${period}`,
  };
});

export function localDateTimeParts(d: Date): { date: string; time: string } {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return { date: `${y}-${m}-${day}`, time: `${hh}:${mm}` };
}
