// components/layout/dashboard-header.tsx
"use client";

import { Navbar } from "./navbar";
import type { ComponentProps } from "react";

export function NavbarWrapper(props: ComponentProps<typeof Navbar>) {
  return <Navbar {...props} />;
}
