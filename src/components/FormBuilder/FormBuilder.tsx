import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuestionTypes, type QuestionType } from "./QuestionTypes";
import { QuestionCard } from "./QuestionCard";
import { Save, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface Question {
  type: QuestionType;
  id: string;
  required?: boolean;
  question?: string;
  options?: string[];
}

interface FormBuilderProps {
  onComplete?: () => void;
}

export const FormBuilder = ({ onComplete }: FormBuilderProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const { toast } = useToast();
  const [formId, setFormId] = useState<string>("");
  const navigate = useNavigate();

  const addQuestion = (type: QuestionType) => {
    setQuestions([...questions, { type, id: crypto.randomUUID(), required: false }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    setQuestions(updatedQuestions);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Form Title Required",
        description: "Please add a title to your form before saving.",
        variant: "destructive",
      });
      return;
    }

    const newFormId = crypto.randomUUID();
    const { error } = await supabase.from('forms').insert({
      id: newFormId,
      title,
      description,
      questions,
      created_at: new Date().toISOString(),
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save form. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setFormId(newFormId);
    toast({
      title: "Form Saved",
      description: "Your form has been saved successfully.",
    });
    
    if (onComplete) {
      onComplete();
    } else {
      navigate('/dashboard');
    }
  };

  const handleShare = () => {
    if (!formId) {
      toast({
        title: "Save Form First",
        description: "Please save your form before generating a sharing link.",
        variant: "destructive",
      });
      return;
    }

    const shareUrl = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(shareUrl);

    toast({
      title: "Share Link Generated",
      description: "Form sharing link has been copied to clipboard.",
    });
  };

  return (
    <div className="form-container space-y-8">
      <div className="space-y-4 animate-fade-in">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Form Title"
          className="text-2xl font-semibold bg-transparent border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Form Description (optional)"
          className="resize-none bg-transparent border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
        />
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            type={question.type}
            onDelete={() => removeQuestion(index)}
            onUpdate={(updates) => updateQuestion(index, updates)}
            required={question.required}
            index={index}
          />
        ))}
      </div>

      <div className="sticky bottom-6 flex justify-between items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border mt-8 shadow-sm">
        <QuestionTypes onAdd={addQuestion} />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Form
          </Button>
        </div>
      </div>
    </div>
  );
};