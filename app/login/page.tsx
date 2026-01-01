'use client';

import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <SignIn
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-xl"
                    }
                }}
                routing="path"
                path="/login"
            />
        </div>
    );
}
