import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const ViewForm = () => {
  const { formId } = useParams();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const { data: form, isLoading } = useQuery({
    queryKey: ["form", formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase
        .from('form_submissions')
        .insert({
          form_id: formId,
          answers: formData,
          submitted_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your response has been submitted successfully.",
      });
      setAnswers({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(answers);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!form) {
    return <div className="flex justify-center items-center min-h-screen">Form not found</div>;
  }

  const renderQuestion = (question: any, index: number) => {
    switch (question.type) {
      case "text":
        return (
          <Input
            required={question.required}
            value={answers[question.id] || ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
            }
            placeholder="Your answer"
            className="mt-2"
          />
        );
      case "multiple":
        return (
          <RadioGroup
            required={question.required}
            value={answers[question.id] || ""}
            onValueChange={(value) =>
              setAnswers((prev) => ({ ...prev, [question.id]: value }))
            }
            className="mt-2 space-y-2"
          >
            {question.options?.map((option: string, optionIndex: number) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} />
                <Label htmlFor={`${question.id}-${optionIndex}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case "checkbox":
        return (
          <div className="mt-2 space-y-2">
            {question.options?.map((option: string, optionIndex: number) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${optionIndex}`}
                  checked={answers[question.id]?.includes(option)}
                  onCheckedChange={(checked) => {
                    const currentAnswers = answers[question.id] || [];
                    const newAnswers = checked
                      ? [...currentAnswers, option]
                      : currentAnswers.filter((a: string) => a !== option);
                    setAnswers((prev) => ({ ...prev, [question.id]: newAnswers }));
                  }}
                />
                <Label htmlFor={`${question.id}-${optionIndex}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold dark:text-white">{form.title}</h1>
            <p className="text-gray-500 dark:text-gray-400">{form.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {form.questions.map((question: any, index: number) => (
              <div key={question.id} className="space-y-2">
                <label className="block text-sm font-medium dark:text-white">
                  {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderQuestion(question, index)}
              </div>
            ))}
            <Button type="submit" className="w-full">Submit</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ViewForm;