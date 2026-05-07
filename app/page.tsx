"use client";

import { useState, useRef, useCallback } from "react";
import { Caveat } from "next/font/google";
import {
  Upload,
  Wand2,
  Download,
  RotateCcw,
  Sparkles,
  ImageIcon,
  AlertCircle,
  Paintbrush,
  ArrowLeftRight,
  CheckCircle2,
  Heart
} from "lucide-react";

// Load a hand-drawn font for playful accents
const caveat = Caveat({ subsets: ["latin"], weight: ["400", "700"] });

// --- DECORATIVE DOODLE SVGS ---
const DoodleUnderline = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 200 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 14.5C55.5 4.5 120 2 196 11.5"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-draw sketch-line"
    />
  </svg>
);

const DoodleArrow = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 45C25 35 45 15 45 15M45 15C38 16 30 18 30 18M45 15C44 22 42 30 42 30"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DoodleStar = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 2C20 2 22 15 38 20C38 20 25 22 20 38C20 38 18 25 2 20C2 20 15 18 20 2Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DoodleLoop = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 60C20 20 70 10 60 40C50 70 10 50 20 20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="6 4"
    />
  </svg>
);
// ------------------------------
const DEMO_ORIGINAL = "/images/flower.jpg";
const DEMO_DOODLE = "/images/doodle_eg.png";

export default function DoodleConverter() {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "ready" | "converting" | "done">(
    "upload",
  );
  const [progress, setProgress] = useState(0);

  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image too large. Max 10MB.");
      return;
    }

    setError(null);
    setResult(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setStep("ready");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleConvert = async () => {
    if (!imageFile) return;

    setLoading(true);
    setError(null);
    setStep("converting");
    setProgress(0);

    const timer = setInterval(
      () => setProgress((p) => (p < 90 ? p + Math.random() * 5 : p)),
      400,
    );

    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      // No need to append style anymore, backend handles it

      const res = await fetch("/api/doodling", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok || data.error)
        throw new Error(data.error || "Conversion failed");

      setProgress(100);
      setTimeout(() => {
        setResult(`data:${data.mimeType};base64,${data.image}`);
        setStep("done");
        setLoading(false);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("ready");
      setLoading(false);
    } finally {
      clearInterval(timer);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `doodlify-sketch-${Date.now()}.png`;
    a.click();
  };

  const handleReset = () => {
    setImage(null);
    setImageFile(null);
    setResult(null);
    setError(null);
    setStep("upload");
    setProgress(0);
  };

  const handleSliderInteraction = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#1a1208] font-sans selection:bg-[#ff6b35] selection:text-white pb-20 overflow-hidden relative">
      {/* Background Floating Doodles */}
      <div className="absolute top-20 left-10 text-[#e8e2d9] animate-wiggle pointer-events-none">
        <DoodleLoop className="w-32 h-32" />
      </div>
      <div className="absolute top-40 right-10 text-[#e8e2d9] animate-float pointer-events-none">
        <DoodleStar className="w-16 h-16 opacity-50" />
      </div>
      <div className="absolute bottom-20 left-20 text-[#e8e2d9] -rotate-12 pointer-events-none">
        <DoodleArrow className="w-24 h-24 opacity-60" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 relative z-10">
        {/* App Header */}
        <header className="flex flex-col items-center justify-center mb-10 md:mb-16 animate-slide-up text-center relative">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] bg-[#1a1208] flex items-center justify-center shadow-xl shadow-black/10 mb-6 relative group">
            <Sparkles className="text-white w-8 h-8 md:w-10 md:h-10 group-hover:scale-110 transition-transform" />
            <DoodleStar className="absolute -top-4 -right-4 text-[#ffd23f] w-8 h-8 animate-bounce-in delay-300" />
          </div>

          <div className="relative inline-block">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3">
              Doodlify.
            </h1>
            <DoodleUnderline className="absolute -bottom-2 left-0 w-full text-[#ff6b35] h-4" />
            <span
              className={`${caveat.className} absolute -top-6 -right-12 text-2xl text-[#ff6b35] rotate-12 whitespace-nowrap hidden sm:block`}
            >
              It's magic! ✨
            </span>
          </div>

          <p className="text-[#5c5040] text-lg md:text-xl font-medium max-w-lg mx-auto mt-6">
            Transform your everyday photos into beautiful hand-drawn art using
            AI magic.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Interaction Card */}
          <div className="lg:col-span-7 bg-white p-2 rounded-[32px] md:rounded-[40px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-[#e8e2d9] relative z-10 transition-all duration-500">
            <div className="p-6 md:p-10">
              {/* UPLOAD STATE */}
              {step === "upload" && (
                <div className="animate-pop-in relative">
                  <div className="absolute -left-12 top-10 hidden lg:block text-[#ff6b35] -rotate-12 animate-wiggle">
                    <DoodleArrow className="w-16 h-16" />
                    <span
                      className={`${caveat.className} absolute -top-8 -left-6 text-xl whitespace-nowrap`}
                    >
                      Drop it here!
                    </span>
                  </div>

                  <div
                    className={`group border-3 border-dashed rounded-[24px] md:rounded-[32px] p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-100 relative overflow-hidden
                      ${dragging ? "border-[#ff6b35] bg-[#fff9f7] scale-[1.02]" : "border-[#e8e2d9] hover:border-[#ff6b35] hover:bg-[#fff9f7]/50"}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                  >
                    <div className="w-20 h-20 rounded-full bg-[#f5f2ec] group-hover:bg-white flex items-center justify-center mb-6 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md relative z-10">
                      <ImageIcon className="w-10 h-10 text-[#9c8e7a] group-hover:text-[#ff6b35] transition-colors" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 relative z-10">
                      Upload a Photo
                    </h2>
                    <p className="text-[#9c8e7a] font-medium mb-8 relative z-10">
                      Drag & drop or tap to browse
                    </p>
                    <button className="bg-[#1a1208] text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-black/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 relative z-10">
                      <Upload size={18} /> Select Image
                    </button>
                  </div>
                </div>
              )}

              {/* READY STATE (Simplified) */}
              {step === "ready" && image && (
                <div className="animate-slide-up">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      Ready to Sketch
                    </h3>
                    <button
                      onClick={handleReset}
                      className="p-2 bg-[#f5f2ec] text-[#5c5040] rounded-full hover:bg-[#e8e2d9] transition-colors"
                      title="Choose a different image"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>

                  <div className="relative w-full aspect-4/3 rounded-[24px] overflow-hidden bg-[#f5f2ec] mb-8 border border-[#e8e2d9] p-2">
                    <div className="w-full h-full rounded-[16px] overflow-hidden shadow-inner">
                      <img
                        src={image}
                        alt="Original"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleConvert}
                    disabled={loading}
                    className="w-full bg-[#ff6b35] hover:bg-[#e55a2b] disabled:opacity-70 text-white py-5 rounded-[20px] font-bold text-lg shadow-xl shadow-[#ff6b35]/20 hover:shadow-2xl hover:shadow-[#ff6b35]/30 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                  >
                    <Wand2 size={22} /> Generate Doodle
                  </button>
                </div>
              )}

              {/* CONVERTING STATE */}
              {step === "converting" && image && (
                <div className="text-center animate-slide-up py-16 relative">
                  <DoodleLoop className="absolute top-10 left-1/4 text-[#e8e2d9] w-32 h-32 animate-spin-slow opacity-50" />
                  <div className="relative w-48 h-48 mx-auto mb-10 z-10">
                    <div className="absolute inset-0 border-4 border-dashed border-[#e8e2d9] rounded-full"></div>
                    <div
                      className="absolute inset-0 border-4 border-[#ff6b35] rounded-full border-t-transparent animate-spin"
                      style={{ animationDuration: "2s" }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span
                        className={`${caveat.className} text-4xl font-bold text-[#ff6b35]`}
                      >
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                  <h3 className={`${caveat.className} text-4xl font-bold mb-2`}>
                    Drawing lines...
                  </h3>
                  <p className="text-[#9c8e7a] font-medium">
                    Applying the pencil sketch style
                  </p>
                </div>
              )}

              {/* DONE STATE */}
              {step === "done" && result && (
                <div className="animate-pop-in relative">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Sparkles className="text-[#ff6b35]" /> Masterpiece Ready!
                    </h3>
                  </div>

                  <div className="relative w-full aspect-4/3 rounded-[24px] overflow-hidden bg-white shadow-lg shadow-black/5 mb-8 border border-[#e8e2d9] p-3">
                    <div className="w-full h-full rounded-[16px] border border-[#f5f2ec] overflow-hidden relative">
                      <img
                        src={result}
                        alt="Doodled Result"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-[#e8e2d9]">
                        <span
                          className={`${caveat.className} text-lg text-[#1a1208]`}
                        >
                          Doodlify
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 bg-[#1a1208] text-white py-4 px-6 rounded-[20px] font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                    >
                      <Download size={20} /> Save Image
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 bg-[#f5f2ec] text-[#1a1208] py-4 px-6 rounded-[20px] font-bold hover:bg-[#e8e2d9] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={20} /> Create Another
                    </button>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-[16px] p-4 flex items-start gap-3 animate-pop-in">
                  <AlertCircle
                    className="text-red-500 shrink-0 mt-0.5"
                    size={20}
                  />
                  <div>
                    <p className="font-bold text-red-800">
                      Oops! Something went wrong
                    </p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel: Authentic Proof / Before & After Slider */}
          <div className="lg:col-span-5 flex flex-col gap-6 pt-4 lg:pt-10">
            <div className="bg-white rounded-[32px] p-2 border border-[#e8e2d9] shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="text-green-500 w-5 h-5" />
                  <h3 className="text-lg font-bold">Real Results</h3>
                </div>
                <p className="text-[#5c5040] text-sm mb-6">
                  Drag the slider to see how AI transforms an ordinary photo
                  into a professional sketch.
                </p>

                {/* Interactive Slider Container */}
                <div
                  ref={sliderRef}
                  className="relative w-full aspect-4/5 rounded-[24px] overflow-hidden cursor-ew-resize select-none border border-[#e8e2d9] group p-1 bg-[#f5f2ec]"
                  onMouseMove={(e) => handleSliderInteraction(e.clientX)}
                  onTouchMove={(e) =>
                    handleSliderInteraction(e.touches[0].clientX)
                  }
                >
                  <div className="relative w-full h-full rounded-[20px] overflow-hidden">
                    {/* Original Image (Background) */}
                    <img
                      src={DEMO_ORIGINAL}
                      alt="Original Photo"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                    <div
                      className={`${caveat.className} absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-lg px-4 py-1 rounded-full z-0`}
                    >
                      Original
                    </div>

                    {/* Doodle Image (Foreground - Clipped by width) */}
                    <div
                      className="absolute top-0 left-0 h-full overflow-hidden pointer-events-none border-r-2 border-white shadow-[2px_0_10px_rgba(0,0,0,0.15)]"
                      style={{ width: `${sliderPos}%` }}
                    >
                      <img
                        src={DEMO_DOODLE}
                        alt="Doodled Photo"
                        className="absolute top-0 left-0 h-full max-w-none object-cover pointer-events-none "
                        style={{
                          width: sliderRef.current?.offsetWidth || "100%",
                        }}
                      />
                      <div
                        className={`${caveat.className} absolute top-4 left-4 bg-[#ff6b35] text-white text-lg px-4 py-1 rounded-full `}
                      >
                        Sketch
                      </div>
                    </div>

                    {/* Draggable Handle */}
                    <div
                      className="absolute top-0 bottom-0 flex items-center justify-center pointer-events-none"
                      style={{
                        left: `${sliderPos}%`,
                        transform: "translateX(-50%)",
                      }}
                    >
                      <div className="w-10 h-10 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.2)] flex items-center justify-center text-[#1a1208] ring-4 ring-white/40 transition-transform group-hover:scale-110 group-active:scale-95">
                        <ArrowLeftRight size={18} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#f5f2ec] rounded-[32px] p-8 border border-[#e8e2d9] relative overflow-hidden">
              <DoodleStar className="absolute -top-5 -right-5 text-white w-20 h-20 opacity-50" />
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2 relative z-10">
                <Paintbrush className="text-[#ff6b35]" size={24} /> Pro Tips
              </h3>
              <ul className="space-y-4 text-[#5c5040] text-sm font-medium relative z-10 mt-5">
                <li className="flex gap-3 items-start">
                  <span
                    className={`${caveat.className} text-[#ff6b35] text-2xl leading-none`}
                  >
                    1.
                  </span>
                  <span className="pt-1">
                    Good lighting yields the best sketch lines.
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <span
                    className={`${caveat.className} text-[#ff6b35] text-2xl leading-none`}
                  >
                    2.
                  </span>
                  <span className="pt-1">
                    High contrast images make outlines pop.
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <span
                    className={`${caveat.className} text-[#ff6b35] text-2xl leading-none`}
                  >
                    3.
                  </span>
                  <span className="pt-1">
                    Portraits and close-ups work incredibly well!
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </main>
             <footer className="mt-20 border-t-2 border-dashed border-[#e8e2d9] pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#9c8e7a] font-medium z-10 relative">
          <p className="flex items-center gap-1.5 text-sm">
            Crafted with <Heart size={14} className="text-[#ff6b35] fill-current animate-pulse" /> by 
            <span className={`${caveat.className} text-[#1a1208] text-xl ml-1`}>Himanshu Joshi</span>
          </p>
          
          <a 
            href="https://x.com/joshimanshuu" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e8e2d9] text-[#1a1208] text-sm hover:border-[#1a1208] hover:shadow-md transition-all active:scale-95 group"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current group-hover:text-[#ff6b35] transition-colors">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Follow for updates
          </a>
        </footer>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/heic"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
