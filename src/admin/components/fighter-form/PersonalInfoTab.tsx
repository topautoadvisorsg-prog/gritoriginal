import { UseFormReturn } from 'react-hook-form';
import { ALL_WEIGHT_CLASSES } from '@/shared/types/fighter';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Switch } from '@/shared/components/ui/switch';
import { TabsContent } from '@/shared/components/ui/tabs';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { FormData, ORGANIZATIONS, STANCES, GENDERS } from './types';

interface PersonalInfoTabProps {
  form: UseFormReturn<FormData>;
}

export const PersonalInfoTab = ({ form }: PersonalInfoTabProps) => {
  return (
    <TabsContent value="personal" className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          rules={{ required: 'First name is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-first-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          rules={{ required: 'Last name is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-last-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="nickname"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nickname</FormLabel>
            <FormControl>
              <Input {...field} placeholder="The Spider" data-testid="input-nickname" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="dateOfBirth"
          rules={{ 
            required: 'Date of birth is required',
            pattern: { value: /^\d{4}-\d{2}-\d{2}$/, message: 'Use YYYY-MM-DD format' }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input {...field} type="date" data-testid="input-dob" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nationality"
          rules={{ required: 'Nationality is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nationality</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-nationality" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-gender">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GENDERS.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="organization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-organization">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ORGANIZATIONS.map(org => (
                    <SelectItem key={org} value={org}>{org}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stance</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-stance">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STANCES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="weightClass"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Weight Class</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-weight-class">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {ALL_WEIGHT_CLASSES.map(wc => (
                  <SelectItem key={wc} value={wc}>{wc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="gym"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gym</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-gym" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="headCoach"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Head Coach</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-head-coach" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="fightingOutOf"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fighting Out Of</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Las Vegas, Nevada" data-testid="input-fighting-out-of" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="rankGlobal"
          rules={{ min: { value: 0, message: 'Must be positive' } }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Global Ranking</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" data-testid="input-rank-global" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rankPromotion"
          rules={{ min: { value: 0, message: 'Must be positive' } }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Promotion Ranking</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" data-testid="input-rank-promotion" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <FormField
          control={form.control}
          name="age"
          rules={{ min: { value: 0, message: 'Must be positive' } }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" data-testid="input-age" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="height"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Height</FormLabel>
              <FormControl>
                <Input {...field} placeholder={`5'10"`} data-testid="input-height" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reach"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reach</FormLabel>
              <FormControl>
                <Input {...field} placeholder={`74"`} data-testid="input-reach" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weight"
          rules={{ min: { value: 0, message: 'Must be positive' } }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (lbs)</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" data-testid="input-weight" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="mt-6 p-4 border rounded-lg bg-muted/30">
        <FormField
          control={form.control}
          name="isVerified"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className={cn(
                  "h-5 w-5",
                  field.value ? "text-green-500" : "text-muted-foreground"
                )} />
                <div>
                  <FormLabel className="text-base font-medium">UFC Verified</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Mark this fighter as verified with official UFC stats
                  </p>
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="toggle-is-verified"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </TabsContent>
  );
};
