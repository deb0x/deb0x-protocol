import Switch from "@mui/material/Switch";
import React, { useContext, useEffect, useState } from "react";
import '../componentsStyling/themeSetter.scss';

import ThemeContext from "./Contexts/ThemeContext";

export default function ThemeSetter() {
    const useTheme = () => useContext(ThemeContext);
    const { theme, setTheme } = useTheme()!;
    const [checked, setChecked] = useState<boolean>()

    useEffect(() => {
        if(theme === "classic") {
            setChecked(true);
        } else {
            setChecked(false);
        }
    }, [])

    const handleChange = (event: any) => {
        setChecked(event.target.checked);
        event.target.checked ? setTheme("classic") : setTheme("dark")
    };

  return (
    <Switch
        className="theme-switcher"
        checked={checked}
        onChange={handleChange}
        value="checked"
    />
  );
}

const themeOptions = [{ value: "classic" }, { value: "dark" }];