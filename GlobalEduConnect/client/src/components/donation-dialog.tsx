import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Coffee, DollarSign } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Form schema for donation
const donationSchema = z.object({
  amount: z.string().min(1, "Please enter an amount").refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Amount must be a positive number" }
  ),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"], {
    required_error: "Please select a currency",
  }),
  message: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

type DonationFormValues = z.infer<typeof donationSchema>;

interface DonationDialogProps {
  receiverId: number;
  receiverName: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function DonationDialog({ 
  receiverId, 
  receiverName, 
  onSuccess,
  trigger
}: DonationDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Donation form
  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: "",
      currency: "USD",
      message: "",
      isAnonymous: false,
    },
  });

  // Predefined amounts
  const predefinedAmounts = ["5", "10", "25", "50", "100"];

  // Donation mutation
  const donationMutation = useMutation({
    mutationFn: async (data: DonationFormValues & { receiverId: number }) => {
      return await apiRequest("POST", "/api/donations", {
        ...data,
        amount: parseFloat(data.amount),
      });
    },
    onSuccess: () => {
      toast({
        title: "Thank you!",
        description: `Your donation to ${receiverName} was successful.`,
      });
      setIsOpen(false);
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Donation failed",
        description: error.message || "There was an error processing your donation.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DonationFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to make a donation.",
        variant: "destructive",
      });
      return;
    }

    donationMutation.mutate({ ...data, receiverId });
  };

  const setPredefinedAmount = (amount: string) => {
    form.setValue("amount", amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center">
            <Coffee className="mr-2 h-4 w-4" />
            Support {receiverName}
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Support {receiverName}</DialogTitle>
          <DialogDescription>
            Show your appreciation with a donation. All donations go directly to the teacher.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Donation Amount</FormLabel>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="Enter amount" 
                        className="pl-9" 
                        {...field} 
                      />
                    </FormControl>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {predefinedAmounts.map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPredefinedAmount(amount)}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <RadioGroup 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    className="flex flex-wrap"
                  >
                    <FormItem className="flex items-center space-x-1 space-y-0 mr-4">
                      <FormControl>
                        <RadioGroupItem value="USD" />
                      </FormControl>
                      <FormLabel className="font-normal">USD ($)</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-1 space-y-0 mr-4">
                      <FormControl>
                        <RadioGroupItem value="EUR" />
                      </FormControl>
                      <FormLabel className="font-normal">EUR (€)</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-1 space-y-0 mr-4">
                      <FormControl>
                        <RadioGroupItem value="GBP" />
                      </FormControl>
                      <FormLabel className="font-normal">GBP (£)</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-1 space-y-0 mr-4">
                      <FormControl>
                        <RadioGroupItem value="CAD" />
                      </FormControl>
                      <FormLabel className="font-normal">CAD ($)</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-1 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="AUD" />
                      </FormControl>
                      <FormLabel className="font-normal">AUD ($)</FormLabel>
                    </FormItem>
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a message of encouragement or appreciation..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your message will be sent along with your donation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Make this donation anonymous
                    </FormLabel>
                    <FormDescription>
                      Your name won't be shared with the recipient.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={donationMutation.isPending}
              >
                {donationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Donate"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}