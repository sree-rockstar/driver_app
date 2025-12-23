import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

interface AnalogueClockPickerProps {
  value: string; // Format: "HH:MM"
  period: "AM" | "PM";
  onChange: (time: string) => void;
  onPeriodChange: (period: "AM" | "PM") => void;
  label: string;
  error?: string;
}

export default function AnalogueClockPicker({
  value,
  period,
  onChange,
  onPeriodChange,
  label,
  error,
}: AnalogueClockPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number>(12);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectingHour, setSelectingHour] = useState(true);
  const clockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(":").map(Number);
      setSelectedHour(hour || 12);
      setSelectedMinute(minute || 0);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clockRef.current && !clockRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour);
    setSelectingHour(false);
    onChange(`${hour}:${String(selectedMinute).padStart(2, "0")}`);
  };

  const handleMinuteClick = (minute: number) => {
    setSelectedMinute(minute);
    onChange(`${selectedHour}:${String(minute).padStart(2, "0")}`);
  };

  const handleDone = () => {
    setIsOpen(false);
    setSelectingHour(true);
  };

  // Clock hours arranged properly: 12 at top, then 1-11 clockwise
  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  // Minutes: 00 at top, then 05, 10, 15... clockwise
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const getPosition = (index: number, total: number) => {
    // Start from top (90 degrees offset) and go clockwise
    const angle = (index * 360) / total - 90;
    const radius = 90;
    const x = radius * Math.cos((angle * Math.PI) / 180);
    const y = radius * Math.sin((angle * Math.PI) / 180);
    return { x, y };
  };

  // Calculate hand angles like a real clock
  // CSS rotate starts from right (3 o'clock) and goes clockwise
  // We want 12 o'clock at top, so we subtract 90 to start from top
  // Hour hand: moves gradually based on both hour and minutes
  // Each hour = 30 degrees (360/12), each minute moves hour hand by 0.5 degrees (30/60)
  const hourAngle = ((selectedHour % 12) * 30) + (selectedMinute * 0.5);
  
  // Minute hand: each minute = 6 degrees (360/60)
  const minuteAngle = selectedMinute * 6;

  return (
    <div className="relative" ref={clockRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`input pr-10 text-left w-full ${error ? "border-red-500" : ""}`}
        >
          <span className="font-medium">
            {value ? `${value} ${period}` : "Select time"}
          </span>
        </button>
        <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 rounded-2xl shadow-2xl p-1 w-[360px]">
          <div className="bg-white rounded-xl p-6">
            {/* Time Display and AM/PM Toggle */}
            <div className="text-center mb-4">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
                {String(selectedHour).padStart(2, "0")}:{String(selectedMinute).padStart(2, "0")}
              </div>
              
              {/* AM/PM Toggle */}
              <div className="flex justify-center space-x-2 mb-2">
                <button
                  type="button"
                  onClick={() => onPeriodChange("AM")}
                  className={`px-6 py-2 rounded-full font-semibold transition-all ${
                    period === "AM"
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => onPeriodChange("PM")}
                  className={`px-6 py-2 rounded-full font-semibold transition-all ${
                    period === "PM"
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  PM
                </button>
              </div>
              
              <div className="text-sm text-gray-500 mt-2">
                {selectingHour ? "Select hour" : "Select minute"}
              </div>
            </div>

            <div className="relative w-72 h-72 mx-auto">
              {/* Clock face with blue/cyan theme */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 shadow-inner"></div>
              
              {/* Outer ring decoration */}
              <div className="absolute inset-0 rounded-full border-4 border-gradient-to-r from-blue-400 to-cyan-400 opacity-30"></div>
              
              {/* Hour Hand */}
              <div
                className="absolute top-1/2 left-1/2 origin-bottom transition-all duration-500"
                style={{
                  width: "7px",
                  height: "55px",
                  background: selectingHour 
                    ? "linear-gradient(to bottom, #2563eb, #0891b2)"
                    : "linear-gradient(to bottom, #1e40af, #0e7490)",
                  transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
                  borderRadius: "4px 4px 0 0",
                  boxShadow: selectingHour 
                    ? "0 3px 10px rgba(37, 99, 235, 0.7)"
                    : "0 2px 6px rgba(30, 64, 175, 0.5)",
                  opacity: selectingHour ? 1 : 0.85,
                  zIndex: selectingHour ? 6 : 5,
                }}
              />
              
              {/* Minute Hand */}
              <div
                className="absolute top-1/2 left-1/2 origin-bottom transition-all duration-500"
                style={{
                  width: "5px",
                  height: "75px",
                  background: !selectingHour
                    ? "linear-gradient(to bottom, #06b6d4, #14b8a6)"
                    : "linear-gradient(to bottom, #0891b2, #0d9488)",
                  transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
                  borderRadius: "3px 3px 0 0",
                  boxShadow: !selectingHour
                    ? "0 3px 10px rgba(6, 182, 212, 0.7)"
                    : "0 2px 6px rgba(8, 145, 178, 0.5)",
                  opacity: !selectingHour ? 1 : 0.85,
                  zIndex: !selectingHour ? 6 : 5,
                }}
              />
              
              {/* Center dot with gradient */}
              <div className="absolute top-1/2 left-1/2 w-5 h-5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10 shadow-lg border-2 border-white"></div>

              {/* Hour or Minute numbers */}
              {(selectingHour ? hours : minutes).map((num, index) => {
                const { x, y } = getPosition(index, selectingHour ? 12 : 12);
                const isSelected = selectingHour
                  ? num === selectedHour
                  : num === selectedMinute;

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() =>
                      selectingHour ? handleHourClick(num) : handleMinuteClick(num)
                    }
                    className={`absolute w-9 h-9 rounded-full flex items-center justify-center font-semibold transition-all transform -translate-x-1/2 -translate-y-1/2 ${
                      isSelected
                        ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white scale-110 shadow-xl text-sm"
                        : "bg-white text-gray-700 hover:bg-gradient-to-br hover:from-blue-100 hover:to-cyan-100 hover:scale-105 shadow-sm text-xs"
                    }`}
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                    }}
                  >
                    {selectingHour ? num : String(num).padStart(2, "0")}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between mt-6 space-x-3">
              <button
                type="button"
                onClick={() => setSelectingHour(!selectingHour)}
                className="flex-1 px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 transition-all"
              >
                {selectingHour ? "Minutes →" : "← Hours"}
              </button>
              <button
                type="button"
                onClick={handleDone}
                className="flex-1 px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

