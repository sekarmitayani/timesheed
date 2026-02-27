"use client";

import { useState } from "react";
import { Settings, Shield, Bell, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/ai/ai-components";
import { useDataStore } from "@/store/useDataStore";
import { toast } from "sonner";

export default function SettingsPage() {
    const settings = useDataStore((s) => s.settings);
    const updateSettings = useDataStore((s) => s.updateSettings);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setSaving(false);
        toast.success("Settings saved successfully");
    };

    return (
        <div className="space-y-6">
            <PageHeader title="System Settings" description="Configure application settings">
                <Button className="gap-2 bg-gradient-to-r from-[#2568C1] to-[#1a4f99]" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </PageHeader>

            {/* General Settings */}
            <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4" /> General Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-muted-foreground mb-1 block">Company Name</label><Input value={settings.companyName} onChange={(e) => updateSettings({ companyName: e.target.value })} /></div>
                        <div>
                            <label className="text-sm text-muted-foreground mb-1 block">Timezone</label>
                            <Select value={settings.timezone} onValueChange={(v) => updateSettings({ timezone: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Asia/Jakarta">Asia/Jakarta (WIB)</SelectItem>
                                    <SelectItem value="Asia/Makassar">Asia/Makassar (WITA)</SelectItem>
                                    <SelectItem value="Asia/Jayapura">Asia/Jayapura (WIT)</SelectItem>
                                    <SelectItem value="UTC">UTC</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-muted-foreground mb-1 block">Standard Work Hours</label><Input type="number" value={settings.workHours} onChange={(e) => updateSettings({ workHours: e.target.value })} /></div>
                        <div><label className="text-sm text-muted-foreground mb-1 block">Overtime Threshold (hours)</label><Input type="number" value={settings.overtimeThreshold} onChange={(e) => updateSettings({ overtimeThreshold: e.target.value })} /></div>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" /> Notification Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { key: "emailNotifications", label: "Email Notifications", desc: "Receive email alerts for important events" },
                        { key: "slackNotifications", label: "Slack Integration", desc: "Send notifications to Slack channels" },
                        { key: "anomalyAlerts", label: "AI Anomaly Alerts", desc: "Get instant alerts when AI detects anomalies" },
                        { key: "weeklyReports", label: "Weekly Reports", desc: "Automated weekly summary reports" },
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                            <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                            <Switch checked={settings[item.key as keyof typeof settings] as boolean} onCheckedChange={(v) => updateSettings({ [item.key]: v })} />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Security Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div><p className="text-sm font-medium">Two-Factor Authentication</p><p className="text-xs text-muted-foreground">Require 2FA for all admin accounts</p></div>
                        <Switch checked={settings.twoFactor} onCheckedChange={(v) => updateSettings({ twoFactor: v })} />
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-muted-foreground mb-1 block">Session Timeout (minutes)</label><Input type="number" value={settings.sessionTimeout} onChange={(e) => updateSettings({ sessionTimeout: e.target.value })} /></div>
                        <div><label className="text-sm text-muted-foreground mb-1 block">Audit Retention (days)</label><Input type="number" value={settings.auditRetention} onChange={(e) => updateSettings({ auditRetention: e.target.value })} /></div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div><p className="text-sm font-medium">IP Whitelist</p><p className="text-xs text-muted-foreground">Only allow access from whitelisted IPs</p></div>
                        <Switch checked={settings.ipWhitelist} onCheckedChange={(v) => updateSettings({ ipWhitelist: v })} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
