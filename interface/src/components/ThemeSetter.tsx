import React, { useContext } from "react";

import ThemeContext from "./Contexts/ThemeContext";

export default function ThemeSetter() {
    const useTheme = () => useContext(ThemeContext);
    const { theme, setTheme } = useTheme()!;

  return (
    <select value={theme} onChange={(e) => {setTheme(e.currentTarget.value); console.log(e.currentTarget.value)}}>
      {themeOptions.map((option, idx) => (
        <option value={option.value} key={idx}>
          {option.value}
        </option>
      ))}
    </select>
  );
}

const themeOptions = [{ value: "gmail" }, { value: "dark" }];