import React from 'react';
import Link from 'next/link';
import styles from './styles/ErrorPage.module.css';

export default function NotFound() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.title}>404 - Page Not Found</h1>
                <p className={styles.message}>The requested page could not be found.</p>
                
                <div className={styles.helpSection}>
                    <h2>Please check that:</h2>
                    <ul>
                        <li>The URL you entered is correct</li>
                        <li>TUF metadata files exist in the public/metadata directory</li>
                        <li>The files contain valid JSON in TUF format</li>
                    </ul>
                    
                    <div className={styles.alternativeSection}>
                        <h2>Alternatively:</h2>
                        <p>You can use a remote TUF repository URL instead of local metadata files.</p>
                        <p>
                            <Link href="/?url=https://tuf-repo-cdn.sigstore.dev/" className={styles.link}>
                                Try with sigstore's TUF repository
                            </Link>
                        </p>
                    </div>
                </div>
                
                <Link href="/" className={styles.button}>
                    Return Home
                </Link>
            </div>
        </div>
    );
} 