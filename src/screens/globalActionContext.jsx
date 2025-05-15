import { createContext, useState } from "react";

export const GlobalActionContext = createContext();

export function GlobalActionProvider({ children }) {
  const [action, setAction] = useState(false);
  return (
    <GlobalActionContext.Provider value={{ action, setAction }}>
      {children}
    </GlobalActionContext.Provider>
  );
}
