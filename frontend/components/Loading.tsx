export default function Loading({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">{message}</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DB954] mx-auto"></div>
      </div>
    </div>
  );
} 