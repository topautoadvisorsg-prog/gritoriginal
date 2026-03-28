import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/shared/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { TabsContent } from '@/shared/components/ui/tabs';
import { FormData } from './types';

interface PerformanceStatsTabProps {
  form: UseFormReturn<FormData>;
}

export const PerformanceStatsTab = ({ form }: PerformanceStatsTabProps) => {
  return (
    <TabsContent value="performance" className="space-y-4 mt-4">
      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <h4 className="text-sm font-medium mb-4">Striking Stats</h4>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="strikeAccuracy"
            rules={{ min: { value: 0, message: 'Min 0' }, max: { value: 100, message: 'Max 100' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strike Accuracy (%)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" max="100" step="0.1" data-testid="input-strike-accuracy" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="strikeDefense"
            rules={{ min: { value: 0, message: 'Min 0' }, max: { value: 100, message: 'Max 100' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strike Defense (%)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" max="100" step="0.1" data-testid="input-strike-defense" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="strikesLandedPerMin"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strikes Landed/Min</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" step="0.01" data-testid="input-strikes-landed" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="strikesAbsorbedPerMin"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strikes Absorbed/Min</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" step="0.01" data-testid="input-strikes-absorbed" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <h4 className="text-sm font-medium mb-4">Grappling Stats</h4>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="takedownAvg"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Takedowns/15 Min</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" step="0.01" data-testid="input-td-avg" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="takedownAccuracy"
            rules={{ min: { value: 0, message: 'Min 0' }, max: { value: 100, message: 'Max 100' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Takedown Accuracy (%)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" max="100" step="0.1" data-testid="input-td-accuracy" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="takedownDefense"
            rules={{ min: { value: 0, message: 'Min 0' }, max: { value: 100, message: 'Max 100' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Takedown Defense (%)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" max="100" step="0.1" data-testid="input-td-defense" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="submissionAvg"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Submission Attempts/15 Min</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" step="0.1" data-testid="input-sub-avg" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="finishRate"
            rules={{ min: { value: 0, message: 'Min 0' }, max: { value: 100, message: 'Max 100' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Finish Rate (%)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" max="100" step="0.1" data-testid="input-finish-rate" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <h4 className="text-sm font-medium mb-4">Streaks</h4>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="longestWinStreak"
            rules={{ min: { value: 0, message: 'Must be positive' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longest Win Streak</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" data-testid="input-longest-win-streak" />
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
