'use client';

import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    --background: #1a1a1a;
    --text: #f5f5f5;
    --primary: #3366cc;
    --secondary: #222222;
    --border: #333333;
    --hover: #444444;
    --link: #6699ff;
    --header: #111111;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html,
  body {
    padding: 0;
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
      Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
    background-color: var(--background);
    color: var(--text);
  }

  a {
    color: var(--link);
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }

  th {
    text-align: left;
    background-color: var(--header);
    padding: 0.75rem;
    font-weight: 600;
    border-bottom: 1px solid var(--border);
  }

  td {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border);
  }

  tr:hover {
    background-color: var(--hover);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .header {
    background-color: var(--header);
    padding: 1rem 0;
    border-bottom: 1px solid var(--border);
  }

  .footer {
    margin-top: 2rem;
    padding: 1rem 0;
    border-top: 1px solid var(--border);
    font-size: 0.875rem;
    color: #888;
  }
`; 