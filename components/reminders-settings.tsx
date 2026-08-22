"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    notificationChannel: "EMAIL" | "WHATSAPP" | "NONE";
    whatsappNumber: string;
    userRole: "CLASS" | "INDIVIDUAL";
  };
  onSaveSuccess?: () => void;
}

export function RemindersSettings({ initialData, onSaveSuccess }: RemindersSettingsProps) {
  const router = useRouter();
  const [remindersEnabled, setRemindersEnabled] = React.useState(initialData?.remindersEnabled ?? false);
  const [semesterTransitionEnabled, setSemesterTransitionEnabled] = React.useState(initialData?.semesterTransitionEnabled ?? true);
  const [scheduleReminderOffsets, setScheduleReminderOffsets] = React.useState<number[]>(initialData?.scheduleReminderOffsets ?? [360, 180, 60]);
  const [taskReminderOffsets, setTaskReminderOffsets] = React.useState<number[]>(initialData?.taskReminderOffsets ?? [1440, 720]);
  const [notificationChannel, setNotificationChannel] = React.useState<"EMAIL" | "WHATSAPP" | "NONE">(initialData?.notificationChannel ?? "EMAIL");
  const [whatsappNumber, setWhatsappNumber] = React.useState(initialData?.whatsappNumber ?? "");
  const userRole = initialData?.userRole ?? "CLASS";
  
  const [newScheduleOffset, setNewScheduleOffset] = React.useState("");
  const [scheduleUnit, setScheduleUnit] = React.useState<"days" | "hours" | "minutes">("hours");
  
  const [newTaskOffset, setNewTaskOffset] = React.useState("");
  const [taskUnit, setTaskUnit] = React.useState<"days" | "hours" | "minutes">("hours");

  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    if (initialData) {
      setRemindersEnabled(initialData.remindersEnabled);
      setSemesterTransitionEnabled(initialData.semesterTransitionEnabled);
      setScheduleReminderOffsets(initialData.scheduleReminderOffsets);
      setTaskReminderOffsets(initialData.taskReminderOffsets);
      setNotificationChannel(initialData.notificationChannel ?? "EMAIL");
      setWhatsappNumber(initialData.whatsappNumber ?? "");
    }
  }, [initialData]);

  const handleSave = async () => {
    if (remindersEnabled && notificationChannel === "WHATSAPP" && userRole === "INDIVIDUAL" && !whatsappNumber) {
      setMessage({ type: "error", text: "Silakan atur nomor WhatsApp Anda di halaman Profil terlebih dahulu. Mengalihkan ke Profil..." });
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
      return;
    }

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
          notificationChannel,
          whatsappNumber: notificationChannel === "WHATSAPP" ? whatsappNumber : undefined,
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
      let val = rawVal;
      if (scheduleUnit === "days") {
        val = rawVal * 1440;
      } else if (scheduleUnit === "hours") {
        val = rawVal * 60;
      }
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
      let val = rawVal;
      if (taskUnit === "days") {
        val = rawVal * 1440;
      } else if (taskUnit === "hours") {
        val = rawVal * 60;
      }
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
    if (val % 1440 === 0) {
      return `${val / 1440} Hari`;
    }
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
          <CardTitle>{userRole === "CLASS" ? "WhatsApp Reminders" : "Study Reminders"}</CardTitle>
        </div>
        <CardDescription>
          {userRole === "CLASS"
            ? "Configure when your class should receive automated reminder broadcasts on WhatsApp group."
            : "Configure when and how you want to receive automated reminder alerts for your schedules and tasks."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle WhatsApp Reminders */}
        <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20 border-border/30 transition-all hover:bg-muted/30">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">Enable Notifications</Label>
            <p className="text-sm text-muted-foreground">
              {userRole === "CLASS"
                ? "Turn on automated broadcast alerts for the group"
                : "Turn on automated alerts for yourself"}
            </p>
          </div>
          <Switch
            checked={remindersEnabled}
            onCheckedChange={setRemindersEnabled}
          />
        </div>

        {/* Notification Channel Selection */}
        {remindersEnabled && (
          <div className="space-y-3 p-4 border rounded-xl bg-muted/10 border-border/30 animate-in fade-in duration-200">
            <Label className="text-base font-semibold">Notification Delivery Channel</Label>
            <p className="text-sm text-muted-foreground">
              Select where the bot should send your study reminders:
            </p>
            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { id: "EMAIL", label: "Email", icon: (
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )},
                { id: "WHATSAPP", label: "WhatsApp", icon: (
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                  </svg>
                )},
                { id: "NONE", label: "None", icon: (
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )},
              ].map((chan) => {
                const isSelected = notificationChannel === chan.id;
                return (
                  <button
                    key={chan.id}
                    type="button"
                    onClick={() => setNotificationChannel(chan.id as any)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary font-semibold shadow-xs"
                        : "bg-background border-border/50 text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                    }`}
                  >
                    <div className={`p-2 rounded-full mb-1 ${isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {chan.icon}
                    </div>
                    <span className="text-xs">{chan.label}</span>
                  </button>
                );
              })}
            </div>

            {/* WhatsApp Phone Number Input */}
            {notificationChannel === "WHATSAPP" && userRole === "INDIVIDUAL" && (
              <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                {!whatsappNumber ? (
                  <div className="p-3.5 border border-yellow-500/30 bg-yellow-500/10 rounded-xl space-y-2">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium leading-relaxed">
                      ⚠️ Anda belum mengatur nomor WhatsApp. Silakan atur nomor WhatsApp Anda di halaman Profil terlebih dahulu untuk mengaktifkan notifikasi.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => router.push("/profile")}
                      className="h-8 text-xs font-semibold bg-yellow-600 text-white hover:bg-yellow-700"
                    >
                      Buka Pengaturan Profil
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="wa-number" className="text-xs font-semibold">Nomor WhatsApp Pribadi</Label>
                    <Input
                      id="wa-number"
                      type="text"
                      placeholder="Contoh: 628123456789"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="h-9"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Masukkan nomor telepon lengkap diawali kode negara (misal 62 untuk Indonesia) tanpa spasi atau tanda +. Bot akan mengirim pesan langsung ke nomor ini.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {notificationChannel === "WHATSAPP" && userRole === "CLASS" && (
              <p className="text-xs text-primary font-medium pt-1">
                📢 Bot akan melakukan siaran pengingat otomatis ke grup WhatsApp yang terhubung.
              </p>
            )}
          </div>
        )}

        {/* Toggle Semester Transition */}
        <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20 border-border/30 transition-all hover:bg-muted/30">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">Semester Transition Alerts</Label>
            <p className="text-sm text-muted-foreground">
              {userRole === "CLASS"
                ? "Notify the group on semester change / increase"
                : "Get notified when semester changes / increases"}
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
            <Select
              value={scheduleUnit}
              onValueChange={(val: any) => setScheduleUnit(val)}
              disabled={!remindersEnabled}
            >
              <SelectTrigger className="h-9 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Hari</SelectItem>
                <SelectItem value="hours">Jam</SelectItem>
                <SelectItem value="minutes">Menit</SelectItem>
              </SelectContent>
            </Select>
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
            <Select
              value={taskUnit}
              onValueChange={(val: any) => setTaskUnit(val)}
              disabled={!remindersEnabled}
            >
              <SelectTrigger className="h-9 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Hari</SelectItem>
                <SelectItem value="hours">Jam</SelectItem>
                <SelectItem value="minutes">Menit</SelectItem>
              </SelectContent>
            </Select>
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
