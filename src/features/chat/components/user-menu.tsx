"use client";

import React from 'react';
import { UserButton } from '@clerk/nextjs';

export default function UserMenu() {
  return <UserButton afterSignOutUrl="/sign-in" />;
}
