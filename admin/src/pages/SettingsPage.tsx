import React, { useState, useEffect } from "react";
import { settings } from "../services/api";
import { useToast } from "../components/ui/use-toast";

interface GlobalSettings {
    default_consultant_comm: number;
    default_user_comm: number;
}

const SettingsPage = () => {
    const [data, setData] = useState<GlobalSettings>({
        default_consultant_comm: 20,
        default_user_comm: 10,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await settings.get();
                if (res) setData(res);
            } catch (err: any) {
                toast({
                    title: "Error fetching settings",
                    description: err.response?.data?.error || err.message,
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [toast]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await settings.update({
                default_consultant_comm: Number(data.default_consultant_comm),
                default_user_comm: Number(data.default_user_comm),
            });
            toast({
                title: "Success",
                description: "Global settings updated successfully",
            });
        } catch (err: any) {
            toast({
                title: "Error updating settings",
                description: err.response?.data?.error || err.message,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Global Financial Settings</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Configure the platform's default commission boundaries. These will apply to all
                        users and consultants by default unless individually overridden.
                    </p>
                </div>

                <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-xl border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Default Consultant Commission (%)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={data.default_consultant_comm}
                                onChange={(e) => setData({ ...data, default_consultant_comm: e.target.valueAsNumber })}
                            />
                            <p className="text-xs text-gray-500">
                                The base percentage deducted from the consultant's hourly rate before payouts.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Default User Commission (Platform Fee %)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={data.default_user_comm}
                                onChange={(e) => setData({ ...data, default_user_comm: e.target.valueAsNumber })}
                            />
                            <p className="text-xs text-gray-500">
                                The base markup percentage added onto the consultant's rate that the user pays.
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            disabled={saving}
                            type="submit"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-600/90 h-10 px-4 py-2"
                        >
                            {saving ? "Saving..." : "Save Configuration"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage;
