/**
 * EmptySlot Component
 *
 * Clickable empty course slot that opens the add course form
 * or accepts drag-and-drop.
 */
import React from 'react';
import { Plus } from 'lucide-react';

export function EmptySlot({
  year,
  quarter,
  slotIndex,
  isOptionalSlot,
  isDropTarget,
  onSlotClick,
  onDragOver,
  onDragLeave,
  onDrop
}) {
  return (
    <div
      onClick={onSlotClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`w-full rounded-lg p-3 border-2 border-dashed transition-all text-sm font-medium flex items-center justify-center min-h-[56px] cursor-pointer ${
        isOptionalSlot
          ? 'bg-gray-100 border-gray-300 text-gray-400 opacity-50 hover:opacity-70'
          : isDropTarget
          ? 'border-blue-400 bg-blue-50 text-blue-600 ring-2 ring-blue-400'
          : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-400 hover:text-blue-600'
      }`}
    >
      <Plus size={18} className="mr-1" />
      {isOptionalSlot ? 'Add Course (Optional)' : 'Add Course'}
    </div>
  );
}
