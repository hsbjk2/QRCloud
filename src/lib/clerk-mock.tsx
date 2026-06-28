import React from 'react';

export const ClerkProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const useUser = () => ({ user: null });
export const SignedIn = ({ children }: { children: React.ReactNode }) => <></>;
export const SignedOut = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SignInButton = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SignUpButton = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const UserButton = () => <></>;
