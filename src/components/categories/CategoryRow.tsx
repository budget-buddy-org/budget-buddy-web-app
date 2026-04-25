export function CategoryRow({ name, onStartEdit }: { name: string; onStartEdit: () => void }) {
  return (
    <li className="flex items-center px-4 py-3 transition-colors hover:bg-muted/30 cursor-pointer">
      <button
        type="button"
        aria-label={`Edit category: ${name}`}
        className="flex-1 cursor-pointer text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        onClick={onStartEdit}
      >
        {name}
      </button>
    </li>
  );
}
