// context/mobile-menu.tsx
"use client";

import { createContext, useContext } from "react";

const MobileMenuContext = createContext({
  openMenu: () => {},
});

export const MobileMenuProvider = MobileMenuContext.Provider;

export const useMobileMenu = () => useContext(MobileMenuContext);
