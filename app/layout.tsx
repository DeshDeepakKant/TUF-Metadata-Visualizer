import React from 'react';
import ClientLayout from './ClientLayout';

export const metadata = {
    title: 'TUF Repository Viewer',
    description: 'A web interface for viewing TUF repository metadata',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    );
} 