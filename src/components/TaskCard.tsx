import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

type TaskCardProps = {
  id: string;
  description: string;
  createdDate: Date;
  targetDate: Date | null;
  onComplete: (id: string) => void;
  onSetTop: (id: string, toggleOff?: boolean) => void;
  isTop?: boolean;
};

const TaskCard = ({
  id,
  description,
  createdDate,
  targetDate,
  onComplete,
  onSetTop,
  isTop
}: TaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex justify-between items-center p-4 rounded-xl shadow-md border transition-all
        ${isTop ? "bg-yellow-600 border-yellow-300" : "bg-gradient-to-r from-cyan-700 to-blue-800 border-cyan-500"}
      `}
    >
      {/* Left: Dragger */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-white pr-4 flex-shrink-0"
        title="Drag to reorder"
      >
        <GripVertical className="w-10 h-10" />
      </div>

      {/* Center: Description */}
      <div className="flex-grow px-4">
        <p className="text-xl font-medium text-white break-words">{description}</p>
      </div>

      {/* Right: Dates + Buttons */}
      <div className="flex flex-col items-end gap-1 text-sm text-cyan-300 min-w-[160px]">
        <p>Created: {new Date(createdDate).toLocaleDateString()}</p>
        {targetDate && (
          <p>Target: {new Date(targetDate).toLocaleDateString()}</p>
        )}
        <button
          onClick={() => onComplete(id)}
          className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white transition-colors"
        >
          Mark Complete
        </button>
        <button
          onClick={() => onSetTop(id, isTop)}
          className={`px-3 py-1 rounded transition-colors ${
            isTop
              ? "bg-red-500 hover:bg-gray-500 text-black"
              : "bg-yellow-500 hover:bg-yellow-600 text-black"
          }`}
        >
          {isTop ? "Unset Priority" : "Top Priority"}
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
