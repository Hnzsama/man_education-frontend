"use client";

import * as React from "react";
import { API_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon, Time02Icon, Task01Icon, Add01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

// Helper function to read cookies natively
function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
}

// Zero-dependency premium Switch component
function Switch({ checked, onCheckedChange, disabled }: { checked: boolean; onCheckedChange: (c: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-xs transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

interface RemindersSettingsProps {
  initialData?: {
    remindersEnabled: boolean;
    semesterTransitionEnabled: boolean;
    scheduleReminderOffsets: number[];
    taskReminderOffsets: number[];
  };
  onSaveSuccess?: () => void;
}

export function RemindersSettings({ initialData, onSaveSuccess }: RemindersSettingsProps) {
  const [remindersEnabled, setRemindersEnabled] = React.useState(initialData?.remindersEnabled ?? false);
  const [semesterTransitionEnabled, setSemesterTransitionEnabled] = React.useState(initialData?.semesterTransitionEnabled ?? true);
  const [scheduleReminderOffsets, setScheduleReminderOffsets] = React.useState<number[]>(initialData?.scheduleReminderOffsets ?? [360, 180, 60]);
  const [taskReminderOffsets, setTaskReminderOffsets] = React.useState<number[]>(initialData?.taskReminderOffsets ?? [1440, 720]);
  
  const [newScheduleOffset, setNewScheduleOffset] = React.useState("");
  const [scheduleUnit, setScheduleUnit] = React.useState<"hours" | "minutes">("hours");
  
  const [newTaskOffset, setNewTaskOffset] = React.useState("");
  const [taskUnit, setTaskUnit] = React.useState<"hours" | "minutes">("hours");

  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    if (initialData) {
      setRemindersEnabled(initialData.remindersEnabled);
      setSemesterTransitionEnabled(initialData.semesterTransitionEnabled);
      setScheduleReminderOffsets(initialData.scheduleReminderOffsets);
      setTaskReminderOffsets(initialData.taskReminderOffsets);
    }
  }, [initialData]);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    const token = getCookie("token");
    try {
      const res = await fetch(`${API_URL}/api/users/me/reminders`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          remindersEnabled,
          semesterTransitionEnabled,
          scheduleReminderOffsets,
          taskReminderOffsets,
        }),
      });

      if (!res.ok) throw new Error("Failed to update settings");

      setMessage({ type: "success", text: "Settings saved successfully! 🎉" });
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const addScheduleOffset = () => {
    const rawVal = parseInt(newScheduleOffset, 10);
    if (!isNaN(rawVal) && rawVal > 0) {
      const val = scheduleUnit === "hours" ? rawVal * 60 : rawVal;
      if (!scheduleReminderOffsets.includes(val)) {
        setScheduleReminderOffsets([...scheduleReminderOffsets, val].sort((a, b) => b - a));
        setNewScheduleOffset("");
      }
    }
  };

  const removeScheduleOffset = (val: number) => {
    setScheduleReminderOffsets(scheduleReminderOffsets.filter((o) => o !== val));
  };

  const addTaskOffset = () => {
    const rawVal = parseInt(newTaskOffset, 10);
    if (!isNaN(rawVal) && rawVal > 0) {
      const val = taskUnit === "hours" ? rawVal * 60 : rawVal;
      if (!taskReminderOffsets.includes(val)) {
        setTaskReminderOffsets([...taskReminderOffsets, val].sort((a, b) => b - a));
        setNewTaskOffset("");
      }
    }
  };

  const removeTaskOffset = (val: number) => {
    setTaskReminderOffsets(taskReminderOffsets.filter((o) => o !== val));
  };

  const formatOffset = (val: number) => {
    if (val % 60 === 0) {
      return `${val / 60} Jam`;
    }
    return `${val} Menit`;
  };

  return (
    <Card className="shadow-lg border-border/40 backdrop-blur-md bg-card/60">
      <CardHeader>
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Notification01Icon} className="size-6 text-primary" />
          <CardTitle>WhatsApp Reminders</CardTitle>
        </div>
        <CardDescription>
          Configure when your class should receive automated reminder broadcasts on WhatsApp group.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle WhatsApp Reminders */}
        <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20 border-border/30 transition-all hover:bg-muted/30">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">Enable Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Turn on automated broadcast alerts for the group
            </p>
          </div>
          <Switch
            checked={remindersEnabled}
            onCheckedChange={setRemindersEnabled}
          />
        </div>

        {/* Toggle Semester Transition */}
        <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20 border-border/30 transition-all hover:bg-muted/30">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">Semester Transition Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Notify the group on semester change / increase
            </p>
          </div>
          <Switch
            checked={semesterTransitionEnabled}
            onCheckedChange={setSemesterTransitionEnabled}
            disabled={!remindersEnabled}
          />
        </div>

        {/* Schedule Reminders Offsets */}
        <div className="space-y-3 p-4 border rounded-xl bg-muted/10 border-border/30">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Time02Icon} className="size-5 text-primary" />
            <Label className="text-base font-semibold">Class Schedules Reminder</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Remind group members about upcoming classes:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {scheduleReminderOffsets.map((offset) => (
              <span
                key={offset}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                {formatOffset(offset)}
                <button
                  type="button"
                  onClick={() => removeScheduleOffset(offset)}
                  className="hover:text-destructive transition-colors ml-1"
                  disabled={!remindersEnabled}
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 max-w-sm pt-2">
            <Input
              type="number"
              placeholder="Contoh: 15 atau 2"
              value={newScheduleOffset}
              onChange={(e) => setNewScheduleOffset(e.target.value)}
              disabled={!remindersEnabled}
              className="h-9 w-32"
            />
            <select
              value={scheduleUnit}
              onChange={(e: any) => setScheduleUnit(e.target.value)}
              disabled={!remindersEnabled}
              className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden"
            >
              <option value="hours">Jam</option>
              <option value="minutes">Menit</option>
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addScheduleOffset}
              disabled={!remindersEnabled}
              className="h-9 gap-1"
            >
              <HugeiconsIcon icon={Add01Icon} className="size-4" /> Tambah
            </Button>
          </div>
        </div>

        {/* Task Reminders Offsets */}
        <div className="space-y-3 p-4 border rounded-xl bg-muted/10 border-border/30">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Task01Icon} className="size-5 text-primary" />
            <Label className="text-base font-semibold">Tasks Deadline Reminder</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Remind group members about task deadlines:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {taskReminderOffsets.map((offset) => (
              <span
                key={offset}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                {formatOffset(offset)}
                <button
                  type="button"
                  onClick={() => removeTaskOffset(offset)}
                  className="hover:text-destructive transition-colors ml-1"
                  disabled={!remindersEnabled}
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 max-w-sm pt-2">
            <Input
              type="number"
              placeholder="Contoh: 30 atau 24"
              value={newTaskOffset}
              onChange={(e) => setNewTaskOffset(e.target.value)}
              disabled={!remindersEnabled}
              className="h-9 w-32"
            />
            <select
              value={taskUnit}
              onChange={(e: any) => setTaskUnit(e.target.value)}
              disabled={!remindersEnabled}
              className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden"
            >
              <option value="hours">Jam</option>
              <option value="minutes">Menit</option>
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTaskOffset}
              disabled={!remindersEnabled}
              className="h-9 gap-1"
            >
              <HugeiconsIcon icon={Add01Icon} className="size-4" /> Tambah
            </Button>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm text-center ${
              message.type === "success"
                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
          >
            {message.text}
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/95 transition-all font-semibold rounded-xl"
        >
          {loading ? "Saving Settings..." : "Save Reminder Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
