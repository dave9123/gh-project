"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";

interface EditableItem {
  id: string;
  text: string;
  isEditing: boolean;
}

export default function Page() {
  const [items, setItems] = useState<EditableItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addNewItem = () => {
    const newId = Date.now().toString();
    const newItem: EditableItem = {
      id: newId,
      text: "",
      isEditing: true,
    };
    setItems([...items, newItem]);
    setEditingId(newId);
  };

  const handleSubmit = (id: string, newText: string) => {
    if (newText.trim() === "") {
      // Remove item if text is empty
      setItems(items.filter((item) => item.id !== id));
    } else {
      // Update item text and stop editing
      setItems(
        items.map((item) =>
          item.id === id ? { ...item, text: newText, isEditing: false } : item
        )
      );
    }
    setEditingId(null);
  };

  const handleDoubleClick = (id: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, isEditing: true } : item
      )
    );
    setEditingId(id);
  };

  const handleKeyPress = (e: React.KeyboardEvent, id: string, text: string) => {
    if (e.key === "Enter") {
      handleSubmit(id, text);
    }
  };

  const handleBlur = (id: string, text: string) => {
    handleSubmit(id, text);
  };

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="flex flex-row items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Product List</h2>
              <Button className="p-3" onClick={addNewItem}>
                +
              </Button>
            </div>

            {/* Render editable items */}
            <div className="mt-4 space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  {item.isEditing ? (
                    <Input
                      ref={editingId === item.id ? inputRef : null}
                      defaultValue={item.text}
                      onKeyPress={(e) =>
                        handleKeyPress(e, item.id, e.currentTarget.value)
                      }
                      onBlur={(e) => handleBlur(item.id, e.target.value)}
                      className="flex-1"
                      placeholder="Enter text..."
                    />
                  ) : (
                    <div
                      className="flex-1 p-2 cursor-pointer hover:bg-gray-100 rounded"
                      onDoubleClick={() => handleDoubleClick(item.id)}
                    >
                      {item.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
