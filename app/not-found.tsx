import Link from 'next/link'

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
            padding: '2rem',
            textAlign: 'center',
        }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                404 - Page Not Found
            </h1>
            <p style={{ marginBottom: '1rem' }}>
                The requested page could not be found.
            </p>
            <div style={{ textAlign: 'left', margin: '1rem 0' }}>
                <p>Please check that:</p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '2rem' }}>
                    <li>The URL you entered is correct</li>
                    <li>TUF metadata files exist in the <code>public/metadata</code> directory</li>
                    <li>The files contain valid JSON in TUF format</li>
                </ul>
            </div>
            <Link
                href="/"
                style={{
                    display: 'inline-block',
                    marginTop: '1.5rem',
                    padding: '0.5rem 1.5rem',
                    backgroundColor: '#3366cc',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                }}
            >
                Return Home
            </Link>
        </div>
    )
} 