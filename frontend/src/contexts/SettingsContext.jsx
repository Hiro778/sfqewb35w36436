import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(null);

    const refresh = useCallback(async () => {
        try {
            const { data } = await api.get("/settings");
            setSettings(data);
        } catch (e) {
            // ignore
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <SettingsContext.Provider value={{ settings, refresh }}>{children}</SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
