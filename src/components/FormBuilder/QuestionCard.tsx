import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Plus } from "lucide-react";
import type { QuestionType } from "./QuestionTypes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface QuestionCardProps {
  type: QuestionType;
  onDelete: () => void;
  onUpdate: (updates: any) => void;
  required?: boolean;
  index: number;
}

export const QuestionCard = ({
  type,
  onDelete,
  onUpdate,
  required = false,
  index,
}: QuestionCardProps) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(type !== "text" ? [""] : []);

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRequiredChange = (checked: boolean) => {
    onUpdate({ required: checked });
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm group animate-fade-in">
      <div className="flex items-center gap-4 mb-4">
        <GripVertical className="w-5 h-5 text-gray-400 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-2">
            <Switch
              id={`required-${index}`}
              checked={required}
              onCheckedChange={handleRequiredChange}
            />
            <Label htmlFor={`required-${index}`}>Required</Label>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      <Input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Enter your question"
        className="mb-4 bg-gray-50/50 border-gray-200"
      />

      {type !== "text" && (
        <div className="space-y-2">
          {options.map((option, idx) => (
            <Input
              key={idx}
              value={option}
              onChange={(e) => updateOption(idx, e.target.value)}
              placeholder={`Option ${idx + 1}`}
              className="mb-2 bg-gray-50/50 border-gray-200"
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addOption}
            className="text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Option
          </Button>
        </div>
      )}
    </div>
  );
};