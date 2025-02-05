import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { PlusCircle, Download, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ["form-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: forms, isLoading: isLoadingForms } = useQuery({
    queryKey: ["forms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (formId: string) => {
    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', formId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete form",
        variant: "destructive",
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["forms"] });
    toast({
      title: "Success",
      description: "Form deleted successfully",
    });
  };

  const handleExportToExcel = (formId: string) => {
    const form = forms?.find(f => f.id === formId);
    const formSubmissions = submissions?.filter(s => s.form_id === formId);
    
    if (!form || !formSubmissions || formSubmissions.length === 0) {
      toast({
        title: "Export Failed",
        description: "No submissions found for this form",
        variant: "destructive",
      });
      return;
    }

    // Transform submissions into a flat array of objects
    const excelData = formSubmissions.map(submission => {
      const answers = typeof submission.answers === 'string' 
        ? JSON.parse(submission.answers) 
        : submission.answers;
      
      return {
        'Submission Date': new Date(submission.submitted_at).toLocaleDateString(),
        ...answers
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Submissions');

    // Generate and download file
    XLSX.writeFile(wb, `${form.title}-submissions.xlsx`);
    
    toast({
      title: "Success",
      description: "Excel file has been downloaded",
    });
  };

  const analyticsData = submissions?.reduce((acc: any[], submission: any) => {
    const date = new Date(submission.submitted_at).toLocaleDateString();
    const existingDate = acc.find(item => item.date === date);
    if (existingDate) {
      existingDate.submissions += 1;
    } else {
      acc.push({ date, submissions: 1 });
    }
    return acc;
  }, []) || [];

  if (isLoadingSubmissions || isLoadingForms) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">Forms Dashboard</h1>
        <Button onClick={() => navigate('/')} className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Create New Form
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forms Overview</CardTitle>
          <CardDescription>View all your forms and their submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="submissions"
                  stroke={theme === 'dark' ? '#4ADE80' : '#16a34a'}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Your Forms</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms?.map((form: any) => (
                    <TableRow key={form.id}>
                      <TableCell>{form.title}</TableCell>
                      <TableCell>{new Date(form.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const shareUrl = `${window.location.origin}/form/${form.id}`;
                              navigator.clipboard.writeText(shareUrl);
                              toast({
                                title: "Link Copied",
                                description: "Form link has been copied to clipboard.",
                              });
                            }}
                          >
                            Copy Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportToExcel(form.id)}
                            className="flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Export Excel
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the form
                                  and all its submissions.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(form.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Recent Submissions</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Answers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions?.map((submission: any) => (
                    <TableRow key={submission.id}>
                      <TableCell>{forms?.find(f => f.id === submission.form_id)?.title}</TableCell>
                      <TableCell>{new Date(submission.submitted_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Submission Details",
                              description: JSON.stringify(submission.answers, null, 2),
                            });
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
