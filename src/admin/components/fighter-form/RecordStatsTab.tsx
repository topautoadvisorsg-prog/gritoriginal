import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/shared/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { TabsContent } from '@/shared/components/ui/tabs';
import { FormData } from './types';

interface RecordStatsTabProps {
  form: UseFormReturn<FormData>;
}

export const RecordStatsTab = ({ form }: RecordStatsTabProps) => {
  return (
    <TabsContent value="record" className="space-y-4 mt-4">
      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <h4 className="text-sm font-medium mb-4">Fight Record</h4>
        <div className="grid grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="wins"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wins</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" data-testid="input-wins" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="losses"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Losses</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" data-testid="input-losses" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="draws"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Draws</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" data-testid="input-draws" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="noContests"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>No Contests</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" data-testid="input-no-contests" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <h4 className="text-sm font-medium mb-4">Win Methods</h4>
        <div className="grid grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="koWins"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>KO Wins</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" data-testid="input-ko-wins" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tkoWins"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>TKO Wins</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" data-testid="input-tko-wins" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="submissionWins"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Submission Wins</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" data-testid="input-sub-wins" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="decisionWins"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Decision Wins</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" data-testid="input-dec-wins" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <h4 className="text-sm font-medium mb-4">Loss Methods</h4>
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="lossesByKo"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>KO/TKO Losses</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" data-testid="input-ko-losses" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lossesBySubmission"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Submission Losses</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" data-testid="input-sub-losses" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lossesByDecision"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Decision Losses</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" data-testid="input-dec-losses" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </TabsContent>
  );
};
