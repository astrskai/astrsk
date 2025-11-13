export default function ChatAutoReplyButton() {
  return (
    <div className="flex flex-col items-center gap-1">
      <button className="h-10 w-10 rounded-lg border border-gray-50 bg-gray-50/20 text-base font-semibold text-gray-50 hover:bg-gray-50/30">
        Off
      </button>

      <div className="text-xs font-semibold text-gray-100">Auto-reply off</div>
    </div>
  );
}
