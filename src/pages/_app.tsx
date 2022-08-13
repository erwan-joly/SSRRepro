import * as React from 'react';
import {  useEffect } from 'react';
export default function App() {
    useEffect(() => {
        console.log(`Test`);
    }, []);

    return <p>test</p>;
};