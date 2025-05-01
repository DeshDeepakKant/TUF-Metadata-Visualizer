'use client';

import styled from 'styled-components';

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

export const Header = styled.header`
  background-color: var(--header);
  padding: 1rem 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 2rem;
`;

export const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
  color: var(--text);
`;

export const TableContainer = styled.div`
  overflow-x: auto;
  margin-bottom: 2rem;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const TableRow = styled.tr`
  &:hover {
    background-color: var(--hover);
  }
`;

export const TableHeader = styled.th`
  text-align: left;
  background-color: var(--header);
  padding: 0.75rem;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
`;

export const TableCell = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid var(--border);
`;

export const Link = styled.a`
  color: var(--link);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export const Footer = styled.footer`
  margin-top: 2rem;
  padding: 1rem 0;
  border-top: 1px solid var(--border);
  font-size: 0.875rem;
  color: #888;
`;

export const SignerInfo = styled.div`
  display: flex;
  align-items: center;
`;

export const RequiredSigners = styled.span`
  font-weight: bold;
  margin-right: 0.25rem;
`;

export const TotalSigners = styled.span`
  color: #888;
`;

export const TimestampInfo = styled.div`
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #888;
`;

export const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: var(--primary);
  color: white;
  margin-left: 0.5rem;
`;

// Add the missing styled components
export const SignerName = styled.span`
  font-weight: 500;
`;

export const OnlineKey = styled.span`
  color: #888;
  font-style: italic;
`;

export const ThresholdInfo = styled.span`
  color: #888;
  margin-left: 0.25rem;
`;

export const SignersList = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
`; 