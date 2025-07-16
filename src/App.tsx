import { useEffect, useState } from 'react';
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import TaskCard from "./components/TaskCard";

interface Task {
  id: string;
  description: string;
  isComplete: boolean;
  createdDate: Date;
  targetDate: Date | null;
  order: number;
  isTopPriority?: boolean;
}

interface CompletedTask {
  id: string;
  description: string;
  isComplete: true;
  createdDate: Date;
  completedDate: Date;
  order: number;
}

const App = () => {
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [taskInput, setTaskInput] = useState<string | null>(null);
  const [targetDateInput, setTargetDateInput] = useState<Date | null>(null);
  const [taskHistory, setTaskHistory] = useState<CompletedTask[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('https://task-priority-app.supera.workers.dev/tasks');
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const raw: Task[] = await res.json();
        const data = raw.map(task => ({
          ...task,
          createdDate: new Date(task.createdDate),
          targetDate: task.targetDate ? new Date(task.targetDate) : null,
        }));
        setTaskList(data);
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      }
    };
    fetchTasks();

    const fetchHistory = async () => {
      try {
        const res = await fetch('https://task-priority-app.supera.workers.dev/history', {
          headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);
        const raw: CompletedTask[] = await res.json();
        const data = raw.map(t => ({
          ...t,
          createdDate: new Date(t.createdDate),
          completedDate: new Date(t.completedDate)
        }));
        setTaskHistory(data);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
    };
    fetchHistory();
  }, []);

  const handleSubmitClick = () => {
    if (!taskInput) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      description: taskInput,
      isComplete: false,
      createdDate: new Date(),
      targetDate: targetDateInput,
      order: taskList.length,
      isTopPriority: false,
    };
    const updatedTaskList = [...taskList, newTask];
    setTaskList(updatedTaskList);
    setTaskInput(null);
    setTargetDateInput(null);
    fetch('https://task-priority-app.supera.workers.dev/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTaskList),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = taskList.findIndex(task => task.id === active.id);
    const newIndex = taskList.findIndex(task => task.id === over.id);
    const reordered = arrayMove(taskList, oldIndex, newIndex).map((task, index) => ({ ...task, order: index }));
    setTaskList(reordered);
    fetch('https://task-priority-app.supera.workers.dev/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reordered),
    });
  };

  const handleCompleteTask = async (id: string) => {
    const taskToComplete = taskList.find(t => t.id === id);
    if (!taskToComplete) return;
    const updatedTaskList = taskList.filter(t => t.id !== id).map((t, i) => ({ ...t, order: i }));
    const completedTask: CompletedTask = {
      id: taskToComplete.id,
      description: taskToComplete.description,
      isComplete: true,
      createdDate: taskToComplete.createdDate,
      completedDate: new Date(),
      order: 0,
    };
    setTaskList(updatedTaskList);
    await fetch('https://task-priority-app.supera.workers.dev/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTaskList),
    });
    try {
      const historyRes = await fetch('https://task-priority-app.supera.workers.dev/history');
      const existing: CompletedTask[] = historyRes.ok ? await historyRes.json() : [];
      const updatedHistory = [completedTask, ...existing];
      await fetch('https://task-priority-app.supera.workers.dev/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedHistory),
      });
      setTaskHistory(updatedHistory);
    } catch (err) {
      console.error("Failed to update task history:", err);
    }
  };

  function formatDateForInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  const handleSetTopPriority = (id: string, toggleOff?: boolean) => {
    const updatedList = taskList.map((task, index) => {
      if (task.id === id) {
        return {
          ...task,
          isTopPriority: !toggleOff,
          order: 0
        };
      }

      const offset = !toggleOff ? 1 : 0;
      return {
        ...task,
        order: toggleOff ? index : index + offset
      };
    }).sort((a, b) => a.order - b.order);

    setTaskList(updatedList);
    fetch('https://task-priority-app.supera.workers.dev/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedList)
    });
  };

  const topPriorityTask = taskList.find(t => t.isTopPriority) || taskList[0];

  return (
    <div className="flex w-screen h-screen bg-gray-900 text-white font-sans">
      <div className="flex-1 p-8 border-r border-gray-700 overflow-y-auto">
        <h1 className="text-5xl font-bold text-center mb-12 text-cyan-400 tracking-wide">Task List</h1>
        <div className="flex gap-4 mb-10 justify-center">
          <input
            placeholder="Add a new task..."
            value={taskInput ?? ""}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitClick(); }}
            className="flex-grow max-w-[400px] px-4 py-2 text-black text-lg rounded-lg border-2 border-cyan-400 shadow focus:outline-none focus:ring focus:ring-cyan-300"
          />
          <input
            type="date"
            value={targetDateInput ? formatDateForInput(targetDateInput) : ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                const [year, month, day] = val.split("-").map(Number);
                const localDate = new Date(year, month - 1, day); // JS months are 0-indexed 😡
                setTargetDateInput(localDate);
              } else {
                setTargetDateInput(null);
              }
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitClick(); }}
            className="w-[180px] px-2 py-2 text-black text-lg rounded-lg border-2 border-cyan-400 shadow focus:outline-none focus:ring focus:ring-cyan-300"
          />
          <button
            onClick={handleSubmitClick}
            className="px-6 py-2 text-lg bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
          >Submit</button>
        </div>

        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext items={taskList.map(task => task.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {taskList.map((task) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  description={task.description}
                  createdDate={task.createdDate}
                  targetDate={task.targetDate}
                  onComplete={handleCompleteTask}
                  onSetTop={handleSetTopPriority}
                  isTop={task.isTopPriority}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex-1 p-8">
        <h2 className="text-3xl font-semibold text-cyan-300 mb-4">I'm currently working on:</h2>
        {topPriorityTask ? (
          <TaskCard
            id={topPriorityTask.id}
            description={topPriorityTask.description}
            createdDate={topPriorityTask.createdDate}
            targetDate={topPriorityTask.targetDate}
            onComplete={handleCompleteTask}
            onSetTop={handleSetTopPriority}
            isTop={true}
          />
        ) : (
          <p className="text-gray-400">Nothing at the moment.</p>
        )}

        <div className="mt-12">
          <h3 className="text-xl font-semibold text-cyan-200 mb-2">Task History</h3>
          <div className="max-h-[300px] overflow-y-auto pr-2 border-t border-cyan-700 pt-2 space-y-1 text-sm text-gray-300">
            {taskHistory
              .sort(
                (a, b) =>
                  new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
              )
              .map((task) => (
                <div key={task.id} className="flex justify-between">
                  <span className="text-cyan-100">{task.description}</span>
                  <span className="text-gray-400">
                    {new Date(task.completedDate).toLocaleDateString()}
                  </span>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
