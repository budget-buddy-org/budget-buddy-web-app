export function RouteLoader() {
  return (
    <div className="flex items-center justify-center py-20 h-full w-full">
      <div className="relative size-12">
        {/* Background ring */}
        <div className="absolute inset-0 rounded-full border-[4.5px] border-primary opacity-15" />
        {/* Animated spinner */}
        <div className="absolute inset-0 rounded-full border-[4.5px] border-transparent border-t-primary animate-spin" />
      </div>
    </div>
  );
}
