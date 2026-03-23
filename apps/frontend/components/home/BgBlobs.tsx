export default function BgBlobs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-100/50 blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-100/40 blur-[120px] animate-pulse-slower" />
    </div>
  );
}

